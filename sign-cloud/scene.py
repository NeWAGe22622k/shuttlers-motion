"""Photoreal cumulus cloud shaped like a Coaster minibus, with the Shuttlers logo on its side.

The cloud density is baked into an OpenVDB grid with geometry nodes (bus SDF + billow noise
+ logo engraving), then path traced in Cycles with multiple scattering under a physical sky.
Renders RGBA (transparent sky) so the sky can be graded/composited separately.

blender-python scene.py --out OUT.png [--w 1080 --h 1920 --samples 96 --logo logo.png ...]
"""
import argparse, math, sys, time, random
import bpy, bmesh
from mathutils import Vector

ap = argparse.ArgumentParser()
ap.add_argument('--out', required=True)
ap.add_argument('--w', type=int, default=1080)
ap.add_argument('--h', type=int, default=1920)
ap.add_argument('--samples', type=int, default=96)
ap.add_argument('--logo', default='')
ap.add_argument('--windows', type=int, default=1)
ap.add_argument('--alpha', type=int, default=1)
ap.add_argument('--bg', type=int, default=1)
ap.add_argument('--seed', type=float, default=0.0)
ap.add_argument('--density', type=float, default=22.0)
ap.add_argument('--puff', type=float, default=1.0)
ap.add_argument('--sun', type=float, default=3.5)
ap.add_argument('--sky', type=float, default=0.08)
ap.add_argument('--engrave', type=float, default=0.10)
ap.add_argument('--voxel', type=float, default=0.018)
ap.add_argument('--yaw', type=float, default=-30)
ap.add_argument('--bounces', type=int, default=48)
ap.add_argument('--blend', default='')
ap.add_argument('--debug', type=int, default=0)
ap.add_argument('--border', default='')
ap.add_argument('--sun-el', type=float, default=55)
ap.add_argument('--sun-az', type=float, default=200)
ap.add_argument('--sun-angle', type=float, default=0.53)
ap.add_argument('--crop', type=int, default=1)
ap.add_argument('--overcast', type=int, default=0)
ap.add_argument('--edge', type=float, default=0.055)
ap.add_argument('--exposure', type=float, default=0.0)
args = ap.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------------------------------------------------------------- geometry
# Coaster-style minibus in local space: x = length (rear 0 -> front 7), y = width, z = up.
L, W = 7.0, 2.08
HALF = W / 2


def mesh_obj(name, bm, hidden=False):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    if hidden:
        ob.hide_render = True; ob.hide_viewport = True
    return ob


def body():
    prof = [  # side profile (x, z), counter-clockwise
        (0.00, 0.40), (6.90, 0.40), (7.03, 0.60), (7.02, 0.98),   # bumper / nose
        (6.84, 1.20),                                             # short bonnet
        (6.36, 2.36), (6.08, 2.60),                               # raked windscreen + roof cap
        (0.25, 2.64), (0.00, 2.50),
    ]
    bm = bmesh.new()
    vs = [bm.verts.new((x, -HALF, z)) for x, z in prof]
    f = bm.faces.new(vs)
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    for v in [e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)]:
        v.co.y += W
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = mesh_obj('Bus', bm)
    bev = ob.modifiers.new('bevel', 'BEVEL')
    bev.width = 0.26; bev.segments = 8; bev.limit_method = 'NONE'
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    ob.modifiers.clear(); old = ob.data; ob.data = me; bpy.data.meshes.remove(old)
    return ob


def cylinders(name, specs):
    bm = bmesh.new()
    for (x, y, z, r, d) in specs:
        res = bmesh.ops.create_cone(bm, cap_ends=True, segments=48, radius1=r, radius2=r, depth=d)
        for v in res['verts']:
            vx, vy, vz = v.co
            v.co = Vector((vx + x, vz + y, vy + z))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(name, bm, hidden=True)


def boxes(name, specs):
    bm = bmesh.new()
    for (x0, x1, y0, y1, z0, z1) in specs:
        res = bmesh.ops.create_cube(bm, size=1.0)
        for v in res['verts']:
            v.co = Vector((x0 + (v.co.x + .5) * (x1 - x0), y0 + (v.co.y + .5) * (y1 - y0), z0 + (v.co.z + .5) * (z1 - z0)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(name, bm, hidden=True)


bus = body()
WR, WZ = 0.42, 0.42
wheels = cylinders('Wheels', [
    (1.70, -HALF + 0.18, 0.47, 0.40, 0.38), (1.70, HALF - 0.18, 0.47, 0.40, 0.38),
    (5.62, -HALF + 0.18, 0.47, 0.40, 0.38), (5.62, HALF - 0.18, 0.47, 0.40, 0.38),
])
win = []
DEPTH = 0.17
zs = (1.52, 2.27)
for x0, x1 in [(0.35, 1.30), (1.42, 2.37), (2.49, 3.44), (3.56, 4.51), (4.63, 5.58), (5.70, 6.32)]:
    win.append((x0, x1, -HALF - 0.5, -HALF + DEPTH, *zs))
    win.append((x0, x1, HALF - DEPTH, HALF + 0.5, *zs))
windows = boxes('Windows', win)

# ---------------------------------------------------------------- GN: mesh -> baked cloud density grid
def build_gn(name, voxel, material, puff=1.0, seed=0.0, extra_union=(), extra_diff=(),
             inflate=0.45, logo=None, engrave=0.0, flat_base=None):
    ng = bpy.data.node_groups.new(name, 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    N, Lk = ng.nodes, ng.links
    gi = N.new('NodeGroupInput'); go = N.new('NodeGroupOutput')
    band = int(math.ceil(0.8 / (voxel * 1.5)))

    def sdf_of(geo_socket):
        n = N.new('GeometryNodeMeshToSDFGrid')
        Lk.new(geo_socket, n.inputs['Mesh'])
        n.inputs['Voxel Size'].default_value = voxel * 1.5
        n.inputs['Band Width'].default_value = band
        return n.outputs[0]

    def obj_geo(ob):
        n = N.new('GeometryNodeObjectInfo'); n.inputs['Object'].default_value = ob
        n.transform_space = 'ORIGINAL'
        return n.outputs['Geometry']

    def math_(op, a, b=None, c=None):
        n = N.new('ShaderNodeMath'); n.operation = op
        for i, v in enumerate((a, b, c)):
            if v is None: continue
            if isinstance(v, (int, float)): n.inputs[i].default_value = v
            else: Lk.new(v, n.inputs[i])
        return n.outputs[0]

    # --- SDF of the shape
    g = sdf_of(gi.outputs[0])
    for ob in extra_union:
        u = N.new('GeometryNodeSDFGridBoolean'); u.operation = 'UNION'
        Lk.new(g, u.inputs[1]); Lk.new(sdf_of(obj_geo(ob)), u.inputs[1])
        g = u.outputs[0]
    for ob in extra_diff:
        d = N.new('GeometryNodeSDFGridBoolean'); d.operation = 'DIFFERENCE'
        Lk.new(g, d.inputs[0]); Lk.new(sdf_of(obj_geo(ob)), d.inputs[1])
        g = d.outputs[0]
    sdf_grid = g

    # --- topology: fog volume of the inflated mesh
    join = N.new('GeometryNodeJoinGeometry')
    Lk.new(gi.outputs[0], join.inputs[0])
    for ob in extra_union:
        Lk.new(obj_geo(ob), join.inputs[0])
    nrm = N.new('GeometryNodeInputNormal')
    sc = N.new('ShaderNodeVectorMath'); sc.operation = 'SCALE'
    Lk.new(nrm.outputs[0], sc.inputs[0]); sc.inputs['Scale'].default_value = inflate
    sp = N.new('GeometryNodeSetPosition')
    Lk.new(join.outputs[0], sp.inputs['Geometry']); Lk.new(sc.outputs[0], sp.inputs['Offset'])
    vol = N.new('GeometryNodeMeshToVolume')
    Lk.new(sp.outputs[0], vol.inputs['Mesh'])
    vol.inputs['Resolution Mode'].default_value = 'Size'
    vol.inputs['Voxel Size'].default_value = voxel
    vol.inputs['Density'].default_value = 1.0
    getd = N.new('GeometryNodeGetNamedGrid'); getd.data_type = 'FLOAT'
    Lk.new(vol.outputs[0], getd.inputs['Volume']); getd.inputs['Name'].default_value = 'density'
    getd.inputs['Remove'].default_value = True

    # --- density field
    posn = N.new('GeometryNodeInputPosition')
    P0 = posn.outputs[0]
    off = N.new('ShaderNodeVectorMath'); off.operation = 'ADD'
    Lk.new(P0, off.inputs[0]); off.inputs[1].default_value = (seed * 13.1 + 0.37, seed * 7.7 + 0.11, seed * 3.3 + 0.73)
    P = off.outputs[0]
    samp = N.new('GeometryNodeSampleGrid'); samp.data_type = 'FLOAT'
    Lk.new(sdf_grid, samp.inputs['Grid']); Lk.new(P0, samp.inputs['Position'])

    def voronoi(scale):
        n = N.new('ShaderNodeTexVoronoi'); n.voronoi_dimensions = '3D'; n.feature = 'SMOOTH_F1'
        n.inputs['Scale'].default_value = scale; n.inputs['Smoothness'].default_value = 1.0
        n.inputs['Randomness'].default_value = 1.0
        Lk.new(P, n.inputs['Vector'])
        return n.outputs['Distance']

    def noise(scale, detail=8, rough=0.55, dist=0.0):
        n = N.new('ShaderNodeTexNoise'); n.noise_dimensions = '3D'
        n.inputs['Scale'].default_value = scale; n.inputs['Detail'].default_value = detail
        n.inputs['Roughness'].default_value = rough; n.inputs['Distortion'].default_value = dist
        Lk.new(P, n.inputs['Vector'])
        return n.outputs['Fac']

    b1 = math_('SUBTRACT', 0.62, voronoi(2.0))
    b2 = math_('SUBTRACT', 0.62, voronoi(4.8))
    b3 = math_('SUBTRACT', 0.62, voronoi(11.0))
    f1 = math_('SUBTRACT', noise(18.0, 6, 0.6, 0.35), 0.5)
    f2 = math_('SUBTRACT', noise(0.6, 2, 0.5), 0.5)
    disp = math_('MULTIPLY', b1, 0.15 * puff)
    disp = math_('MULTIPLY_ADD', b2, 0.095 * puff, disp)
    disp = math_('MULTIPLY_ADD', b3, 0.05 * puff, disp)
    disp = math_('MULTIPLY_ADD', f1, 0.05 * puff, disp)
    disp = math_('MULTIPLY_ADD', f2, 0.08 * puff, disp)
    d = math_('SUBTRACT', samp.outputs[0], disp)

    sep = N.new('ShaderNodeSeparateXYZ'); Lk.new(P0, sep.inputs[0])
    logo_mask = None
    if logo:
        path, (x0, x1, z0, z1) = logo
        img = bpy.data.images.load(path)
        u = math_('MULTIPLY', math_('SUBTRACT', sep.outputs['X'], x0), 1.0 / (x1 - x0))
        v = math_('MULTIPLY', math_('SUBTRACT', sep.outputs['Z'], z0), 1.0 / (z1 - z0))
        comb = N.new('ShaderNodeCombineXYZ'); Lk.new(u, comb.inputs[0]); Lk.new(v, comb.inputs[1])
        tex = N.new('GeometryNodeImageTexture'); tex.inputs['Image'].default_value = img
        tex.extension = 'CLIP'; tex.interpolation = 'Cubic'
        Lk.new(comb.outputs[0], tex.inputs['Vector'])
        side = math_('LESS_THAN', sep.outputs['Y'], 0.0)
        logo_mask = math_('MULTIPLY', tex.outputs['Alpha'], side)
        d = math_('MULTIPLY_ADD', logo_mask, engrave, d)
    if flat_base is not None:
        d = math_('MAXIMUM', d, math_('SUBTRACT', flat_base, sep.outputs['Z']))

    # soft edge whose width is modulated by fine noise: wispy in places, crisp in others
    wisp = math_('MULTIPLY_ADD', noise(7.0, 4, 0.5), args.edge * 1.4, args.edge * 0.3)
    t = math_('DIVIDE', math_('SUBTRACT', 0.012, d), wisp)
    t = math_('MINIMUM', math_('MAXIMUM', t, 0.0), 1.0)
    dens = math_('POWER', t, 1.3)
    if args.debug == 2:
        dens = math_('LESS_THAN', samp.outputs[0], 0.0)

    f2g = N.new('GeometryNodeFieldToGrid'); f2g.data_type = 'FLOAT'
    f2g.grid_items.new('FLOAT', 'density')
    if logo_mask is not None:
        f2g.grid_items.new('FLOAT', 'logo')
    vox = N.new('GeometryNodeGridVoxelize'); vox.data_type = 'FLOAT'
    Lk.new(getd.outputs['Grid'], vox.inputs['Grid'])
    Lk.new(vox.outputs['Grid'], f2g.inputs['Topology'])
    Lk.new(dens, f2g.inputs['density'])
    if logo_mask is not None:
        Lk.new(logo_mask, f2g.inputs['logo'])

    st = N.new('GeometryNodeStoreNamedGrid'); st.data_type = 'FLOAT'
    Lk.new(getd.outputs['Volume'], st.inputs['Volume']); st.inputs['Name'].default_value = 'density'
    Lk.new(f2g.outputs['density'], st.inputs['Grid'])
    out_geo = st.outputs[0]
    if logo_mask is not None:
        st2 = N.new('GeometryNodeStoreNamedGrid'); st2.data_type = 'FLOAT'
        Lk.new(out_geo, st2.inputs['Volume']); st2.inputs['Name'].default_value = 'logo'
        Lk.new(f2g.outputs['logo'], st2.inputs['Grid'])
        out_geo = st2.outputs[0]
    sm = N.new('GeometryNodeSetMaterial'); sm.inputs['Material'].default_value = material
    Lk.new(out_geo, sm.inputs['Geometry'])
    Lk.new(sm.outputs[0], go.inputs[0])
    return ng


def cloud_material(name, density, tint=False):
    m = bpy.data.materials.new(name)
    nt = m.node_tree; N, Lk = nt.nodes, nt.links
    N.clear()
    out = N.new('ShaderNodeOutputMaterial')
    vol = N.new('ShaderNodeVolumePrincipled')
    vol.inputs['Density'].default_value = density
    vol.inputs['Anisotropy'].default_value = 0.3
    vol.inputs['Absorption Color'].default_value = (0.0, 0.0, 0.0, 1.0)
    if tint:
        at = N.new('ShaderNodeAttribute'); at.attribute_name = 'logo'; at.attribute_type = 'GEOMETRY'
        mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'
        Lk.new(at.outputs['Fac'], mix.inputs['Factor'])
        mix.inputs['A'].default_value = (1, 1, 1, 1)
        mix.inputs['B'].default_value = (0.62, 0.78, 1.0, 1)
        Lk.new(mix.outputs['Result'], vol.inputs['Color'])
    else:
        vol.inputs['Color'].default_value = (1, 1, 1, 1)
    Lk.new(vol.outputs['Volume'], out.inputs['Volume'])
    return m


logo = None
if args.logo:
    from PIL import Image
    im = Image.open(args.logo); aspect = im.width / im.height
    lh = 0.60; lw = lh * aspect
    if lw > 5.0: lw = 5.0; lh = lw / aspect
    cx, cz = 3.30, 1.02
    logo = (args.logo, (cx - lw / 2, cx + lw / 2, cz - lh / 2, cz + lh / 2))

mat = cloud_material('Cloud', args.density, tint=bool(logo))
gn = build_gn('BusCloud', args.voxel, mat, puff=args.puff, seed=args.seed, extra_union=[wheels],
              extra_diff=[windows] if args.windows else [], logo=logo, engrave=args.engrave)
bus.modifiers.new('cloud', 'NODES').node_group = gn

BUS_Z = 13.7
CAM_Y = -55.0
bus.location = (-3.5, 0.0, -1.3)
root = bpy.data.objects.new('Root', None); scene.collection.objects.link(root)
bus.parent = root
root.location = (0, 0, BUS_Z)
root.rotation_euler = (0, 0, math.radians(args.yaw))

# ---------------------------------------------------------------- background cumulus
if args.bg:
    def blobs(name, spheres):
        bm = bmesh.new()
        for (x, y, z, rx, ry, rz) in spheres:
            res = bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=1.0)
            for v in res['verts']:
                v.co = Vector((x + v.co.x * rx, y + v.co.y * ry, z + v.co.z * rz))
        return mesh_obj(name, bm)

    rng = random.Random(7)

    def cumulus(name, n, length):
        sp = []
        for i in range(n):
            x = (i / (n - 1) - .5) * length + rng.uniform(-.3, .3)
            r = rng.uniform(.9, 1.6) * (1.0 - 0.45 * abs(i / (n - 1) - .5) * 2)
            sp.append((x, rng.uniform(-.5, .5), r * 0.55, r * 1.25, r, r * 0.95))
        return blobs(name, sp)

    bgs = [
        ('BG1', 7, 7.0, (-24, 280, 8), 4.6, 10),
        ('BG2', 6, 6.0, (22, 320, 11), 4.8, -20),
        ('BG3', 5, 5.0, (-30, 420, 30), 4.0, 30),
        ('BG4', 5, 4.5, (30, 380, 41), 3.4, 0),
        ('BG5', 4, 4.0, (2, 450, 18), 3.0, 15),
    ]
    for name, n, length, loc, sc, yaw in bgs:
        o = cumulus(name, n, length)
        m_ = cloud_material(name + 'Mat', args.density * 0.25)
        g = build_gn(name + 'Cloud', 0.05, m_, puff=2.4, seed=(sum(map(ord, name)) % 97), inflate=0.7, flat_base=0.05)
        o.modifiers.new('cloud', 'NODES').node_group = g
        o.location = loc; o.scale = (sc, sc, sc); o.rotation_euler = (0, 0, math.radians(yaw))

# ---------------------------------------------------------------- camera
cam_d = bpy.data.cameras.new('Cam'); cam_d.lens = 120; cam_d.sensor_fit = 'VERTICAL'; cam_d.sensor_height = 36
cam = bpy.data.objects.new('Cam', cam_d); scene.collection.objects.link(cam); scene.camera = cam
cam.location = (0.0, CAM_Y, 0.0)
target = Vector((0.0, 0.0, -CAM_Y * math.tan(math.radians(10.8))))
cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()

# ---------------------------------------------------------------- sky + sun
world = bpy.data.worlds.new('Sky'); scene.world = world
wn = world.node_tree.nodes; wl = world.node_tree.links; wn.clear()
sky = wn.new('ShaderNodeTexSky'); sky.sky_type = 'MULTIPLE_SCATTERING'
sky.sun_disc = False
sun_el, sun_az = math.radians(args.sun_el), math.radians(args.sun_az)
sky.sun_elevation = sun_el; sky.sun_rotation = sun_az
sky.altitude = 300; sky.air_density = 1.0; sky.aerosol_density = 0.5
sky.ground_albedo = 0.85
bg = wn.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value = args.sky
wo = wn.new('ShaderNodeOutputWorld')
if args.overcast:
    # neutral overcast dome: brighter toward the zenith, grey at the horizon, darker below
    tcw = wn.new('ShaderNodeTexCoord'); sepw = wn.new('ShaderNodeSeparateXYZ')
    wl.new(tcw.outputs['Generated'], sepw.inputs[0])
    ramp = wn.new('ShaderNodeValToRGB')
    mr = wn.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = -1; mr.inputs['From Max'].default_value = 1
    wl.new(sepw.outputs['Z'], mr.inputs['Value']); wl.new(mr.outputs['Result'], ramp.inputs['Fac'])
    cr = ramp.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.16, 0.16, 0.165, 1)
    cr.elements[1].position = 1.0; cr.elements[1].color = (0.95, 0.96, 0.98, 1)
    e = cr.elements.new(0.5); e.color = (0.45, 0.46, 0.48, 1)
    wl.new(ramp.outputs['Color'], bg.inputs[0])
else:
    wl.new(sky.outputs[0], bg.inputs[0])
wl.new(bg.outputs[0], wo.inputs['Surface'])

sun_d = bpy.data.lights.new('Sun', 'SUN'); sun_d.energy = args.sun; sun_d.angle = math.radians(args.sun_angle)
sun_d.color = (1.0, 0.975, 0.94)
sun = bpy.data.objects.new('Sun', sun_d); scene.collection.objects.link(sun)
sd = Vector((math.sin(sun_az) * math.cos(sun_el), math.cos(sun_az) * math.cos(sun_el), math.sin(sun_el)))
sun.rotation_euler = (-sd).to_track_quat('-Z', 'Y').to_euler()

# ---------------------------------------------------------------- render settings
scene.render.engine = 'CYCLES'
c = scene.cycles
c.device = 'CPU'; c.samples = args.samples; c.use_adaptive_sampling = True; c.adaptive_threshold = 0.01
c.use_denoising = True; c.denoiser = 'OPENIMAGEDENOISE'
c.max_bounces = args.bounces; c.volume_bounces = args.bounces; c.diffuse_bounces = 2; c.glossy_bounces = 2
c.transparent_max_bounces = 16
c.volume_step_rate = 1.0
scene.render.film_transparent = bool(args.alpha)
scene.render.resolution_x = args.w; scene.render.resolution_y = args.h; scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'None'
scene.view_settings.exposure = args.exposure
if args.border:
    bx0, bx1, by0, by1 = map(float, args.border.split(','))
    scene.render.use_border = True; scene.render.use_crop_to_border = bool(args.crop)
    scene.render.border_min_x, scene.render.border_max_x, scene.render.border_min_y, scene.render.border_max_y = bx0, bx1, by0, by1
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA' if args.alpha else 'RGB'
scene.render.image_settings.color_depth = '16'
scene.render.filepath = args.out
if args.blend:
    bpy.ops.wm.save_as_mainfile(filepath=args.blend)
t0 = time.time()
if not args.out.endswith('NONE'):
    bpy.ops.render.render(write_still=True)
print('RENDER_SECONDS', round(time.time() - t0, 1))
