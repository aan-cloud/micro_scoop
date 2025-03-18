# Whole Slide Image Viewer

## Overview
Whole Slide Image Viewer is a React and TypeScript-based application designed to visualize and interact with whole slide images. It provides patient information, detection results, and a zoomed-in view of detected cells in a pathology sample.

## Features
- Load and display a whole slide image
- Show patient details from `output.json`
- Highlight detected cell regions
- Interactive zoomed-in view
- Mouse hover-based viewport navigation

## Installation
### Prerequisites
- Node.js (>= 14.x)
- npm or yarn

### Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/whole-slide-viewer.git
   cd whole-slide-viewer
   ```
2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```
3. Start the development server:
   ```sh
   npm run dev
   # or
   yarn dev
   ```
4. Open the application in your browser at `http://localhost:3000`


## Configuration
Ensure `output.json` is in the correct format and contains valid detection results. If `inference_results` is a string, it will be parsed into a valid JSON object automatically.

## Usage
1. Hover over the whole slide image to view a zoomed-in section in the right panel.
2. Detection boxes will highlight identified cells.
3. The patient information panel on the left displays metadata.

## Troubleshooting
### Common Issues
- **Image not loading:** Ensure `sample_wsi.png` exists in the `public/assets` directory.
- **Data parsing error:** Check that `output.json` does not contain invalid JSON formatting.
- **Mouse hover misalignment:** Verify that the viewport calculations correctly reflect the image scale.

## Author
Developed by **Muhammad  Farhan**.

## Contributions
Contributions are welcome! Please submit a pull request or open an issue for any bugs or improvements.

