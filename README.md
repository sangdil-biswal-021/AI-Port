# 🌊 AI Powered Port - Interactive 3D Dashboard
---

## 🚀 Features

- **Multi-Scene Management:**  
  Switch between different scenes ("The Port," "Vehicle Management," "Predictive Maintenance") with a clean UI.

- **Interactive Object Focusing:**  
  Click on assets like cranes, ships, and containers to focus the camera and view detailed information.

- **Dynamic UI Overlays:**  
  Context-aware panels display detailed stats, live analytics, AI-driven predictions, and critical alerts.

- **Scene-Specific Functionality:**
  - **Scene 1 & 2:** Standard focus, details panels, and analytics overlays.  
  - **Scene 2:** A special *tracking mode* that follows moving vehicles with a dedicated analytics panel.  
  - **Scene 3:** Rich data visualization with color-coded priorities, dwell-time analysis, animated graphs, and AI diagnostic reports.

- **Real-Time Effects:**  
  Critical machine alerts trigger a visual red/yellow flickering effect on the 3D model.

- **Camera Controls:**  
  Smooth camera animations for focusing and robust user controls with intelligent constraints (zoom and angle limits)

---

## 🧩 Prerequisites

Before starting, ensure the following are installed on your system:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

---

## ⚙️ Setup and Installation

Follow these steps carefully to run the project locally.

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/sangdil-biswal-021/AI-Port.git
cd .\AI-Port
```


###2️⃣ Important: Download 3D Models

The large .glb 3D model files are not included in this repository.
You must download them manually from the link below:

👉  [DOWNLOAD 3D MODELS HERE](https://drive.google.com/drive/folders/1BN49-1SyIFzoUlxmGgpm-gk3Z1896w-m)

Download the following files:

scene.glb

scene2.glb

scene3.glb


###3️⃣ Place the 3D Models

Inside your project folder, create a new folder named model and place all three .glb files inside it.

Your structure should look like this:

/your-project-folder
|-- /model
|   |-- scene.glb
|   |-- scene2.glb
|   |-- scene3.glb
|-- (other project files...)
<img width="458" height="631" alt="image" src="https://github.com/user-attachments/assets/29b4353f-1883-4ef2-90dc-e4508e65c0eb" />



###4️⃣ Download the HDRI Texture(can skip)

This project uses an HDRI for realistic lighting.(Aleardy Set up follow instruciton if want to change it)

You can download an .hdr file (e.g., from Poly Haven)
Recommended: studio_small_03_1k.hdr(already used)
If you change the filename, update it in scene.js.


###5️⃣ Install Dependencies

Open a terminal in the root folder and run:
```
npm install
```

This will download all the necessary libraries like Three.js, Vite, and TWEEN.js.


###6️⃣ Run the Application

Start the local development server with:
```
npx vite
#or
npm run dev

```
This will start the Vite dev server.
Your console will display a local URL, usually:

http://localhost:5173/


Open it in your browser to view the 3D dashboard.

#Quick Navigation Guide:
Use both Mouse and keyboard to achieve higher flexibility
Here use right click + drag to rotate the view
Shift + right click + drag to displace forward
scroll for forward ans backward movement

you can use W,A,S,D or arrows for a orbital controll on the camera. 




🗂️ Project Structure
```
|-- model/          # Folder for .glb 3D models
|   |-- scene.glb
|   |-- scene2.glb
|   |-- scene3.glb
|
|-- textures/       # Folder for HDRI environment maps
|   |-- your_hdri_file.hdr
|
|-- node_modules/   # Installed dependencies
|
|-- animate.js      # Main animation loop (requestAnimationFrame)
|-- camera.js       # Camera and OrbitControls setup
|-- index.html      # Main HTML file and UI overlays
|-- interactions.js # Core logic for clicks, focus, and UI management
|-- loader.js       # Handles GLTF model loading and animations
|-- main.js         # Entry point of the application
|-- package.json    # Project metadata and dependencies
|-- scene.js        # Scene and lighting setup
|-- settings.js     # Global configuration
|-- README.md       # This file
```

🧠 Technologies Used
Blender
 — For creating 3D animation and scenes
 
Three.js
 — 3D rendering and scene management

Vite
 — Lightning-fast development server and bundler

TWEEN.js
 — Smooth animations and transitions
