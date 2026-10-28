"""Export the ferry from Ferry's app icon model as a GLB for the product page.

Usage (from this repository's root, with the Ferry repository next to it under ../Swift/Ferry):
    blender -b ../Swift/Ferry/Design/AppIcon/FerryIcon.blend -P scripts/export-ferry-model.py

Writes app/assets/ferry/ferry.glb. glTF has no color ramps, so the banded hull and funnel are cut at each
band and every band gets a plain material; the waterline foam is left out.
"""

import os

import bmesh
import bpy
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "app", "assets", "ferry", "ferry.glb")

# Same colors and bands as build_icon_model.py.
HULL, BOOT, WHITE, YELLOW, BLACK = "#1F5FD6", "#D9363E", "#F4F6F8", "#FFC53D", "#1D2129"
BANDS = {
    # object: (local z where each band starts, color), ascending
    "hull": [(-10.0, BOOT), (-0.02, WHITE), (0.08, HULL)],
    "funnel": [(-10.0, YELLOW), (1.05, HULL), (1.3, YELLOW), (1.58, BLACK)],
}


def linear(hex_value):
    value = hex_value.lstrip("#")
    srgb = [int(value[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb)


def plain_material(name, color, roughness=0.3, coat=0.6):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = next((n for n in nodes if n.type == "BSDF_PRINCIPLED"), None)
    if bsdf is None:
        bsdf = nodes.new("ShaderNodeBsdfPrincipled")
        output = next((n for n in nodes if n.type == "OUTPUT_MATERIAL"), None) or nodes.new("ShaderNodeOutputMaterial")
        mat.node_tree.links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = (*linear(color), 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Coat Weight"].default_value = coat
    bsdf.inputs["Coat Roughness"].default_value = 0.08
    return mat


def split_bands(obj, bands):
    """Cut the mesh at each band's start and give every face the material of the band it sits in."""
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    for z, _ in bands[1:]:
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, z), plane_no=(0, 0, 1))
    mesh.materials.clear()
    for index, (_, color) in enumerate(bands):
        mesh.materials.append(plain_material(f"{obj.name}-{index}", color))
    for face in bm.faces:
        z = face.calc_center_median().z
        face.material_index = max(i for i, (start, _) in enumerate(bands) if z >= start)
    bm.to_mesh(mesh)
    bm.free()


def main():
    ferry = bpy.data.collections["Ferry"]
    keep = [obj for obj in ferry.objects if obj.name != "foam"]

    bpy.ops.object.select_all(action="DESELECT")
    for obj in keep:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = keep[0]
    # Curves and the funnel's bevel become plain meshes.
    bpy.ops.object.convert(target="MESH")

    for obj in keep:
        if obj.name in BANDS:
            split_bands(obj, BANDS[obj.name])

    # Sit the ferry on the origin: centered in plan, keel at zero.
    corners = [obj.matrix_world @ Vector(c) for obj in keep for c in obj.bound_box]
    low = Vector(min(c[i] for c in corners) for i in range(3))
    high = Vector(max(c[i] for c in corners) for i in range(3))
    offset = Vector(((low.x + high.x) / -2, (low.y + high.y) / -2, -low.z))
    for obj in keep:
        obj.location += offset

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=OUT, export_format="GLB", use_selection=True, export_apply=True,
        export_cameras=False, export_lights=False, export_yup=True,
    )
    print(f"Wrote {OUT}")


main()
