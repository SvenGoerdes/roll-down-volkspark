# Image to textured 3D model (GLB) with TRELLIS.2 on Microsoft's free Hugging Face Space (ADR 0017).
# python3 tools/gen-3d.py <image> <out.glb> [seed]      needs: pip install gradio_client
# Uses the free ZeroGPU quota; set HF_TOKEN for a larger quota.
import os, shutil, sys
from gradio_client import Client, handle_file

image, out = sys.argv[1], sys.argv[2]
seed = int(sys.argv[3]) if len(sys.argv) > 3 else 0
client = Client("microsoft/TRELLIS.2", token=os.environ.get("HF_TOKEN"), verbose=False)
client.predict(api_name="/start_session")
prepped = client.predict(handle_file(image), api_name="/preprocess_image")
client.predict(handle_file(prepped), seed, "1024", api_name="/image_to_3d")
glb = client.predict(100000, 1024, api_name="/extract_glb")  # ~100k faces, 1024 px texture
shutil.copy(glb[0], out)
print(out)
