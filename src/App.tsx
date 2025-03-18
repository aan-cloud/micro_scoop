import { useState, useEffect, useRef } from 'react';
import sampleImageUrl from './assets/sample_wsi.png';

interface DetectionResult {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
}

interface PatientData {
  id: string;
  date: string;
  sample_type: string;
}

const parseNonStandardJSON = (str: string): any => {
  try {
    // Wrap the string in parentheses so it can be evaluated as an object literal
    return Function('"use strict";return (' + str + ')')();
  } catch (error) {
    console.error('Error evaluating non-standard JSON string:', error);
    throw error;
  }
};

const WholeSlideImageViewer = () => {
  // State for detection results
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  // State for mouse position relative to the image (not the container)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  // State for viewport size (hover area)
  const [viewportBox, setViewportBox] = useState<{ width: number; height: number }>({ width: 100, height: 100 });
  // State for hover status
  const [isHovering, setIsHovering] = useState<boolean>(false);
  // State for patient data
  const [patientData, setPatientData] = useState<PatientData | null>(null);

  // Refs for the container and the main image
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const mainImageRef = useRef<HTMLImageElement>(null);
  // State to store image offsets (because object-cover centers the image)
  const [imageOffsets, setImageOffsets] = useState({ offsetX: 0, offsetY: 0, imageWidth: 0, imageHeight: 0 });

  // Function to parse the output.json file
  const parsePatientData = (data: any) => {
    let inference;
    if (typeof data.inference_results === 'string') {
      try {
        inference = parseNonStandardJSON(data.inference_results);
      } catch (error) {
        console.error('Error parsing inference_results', error);
        inference = null;
      }
    } else {
      inference = data.inference_results;
    }
    const parsedDetectionResults: DetectionResult[] =
      inference && inference.output && inference.output.detection_results
        ? inference.output.detection_results.map((item: any) => ({
            x1: item[0],
            y1: item[1],
            x2: item[2],
            y2: item[3],
            label: item[4],
          }))
        : [];

    const parsedPatientData: PatientData = {
      id: data.patient_id,
      date: data.date,
      sample_type: data.sample_type,
    };

    return { parsedPatientData, parsedDetectionResults };
  };

  useEffect(() => {
    const loadPatientData = async () => {
      try {
        const response = await fetch('../output.json');
        const data = await response.json();
        const { parsedPatientData, parsedDetectionResults } = parsePatientData(data);
        setPatientData(parsedPatientData);
        setDetectionResults(parsedDetectionResults);
      } catch (error) {
        console.error('Error loading patient data:', error);
      }
    };

    loadPatientData();
  }, []);

  // When the main image finishes loading, calculate the offsets (because object-cover centers the image)
  const handleImageLoad = () => {
    if (imageContainerRef.current && mainImageRef.current) {
      const containerRect = imageContainerRef.current.getBoundingClientRect();
      const imgRect = mainImageRef.current.getBoundingClientRect();
      const offsetX = (containerRect.width - imgRect.width) / 2;
      const offsetY = (containerRect.height - imgRect.height) / 2;
      setImageOffsets({ offsetX, offsetY, imageWidth: imgRect.width, imageHeight: imgRect.height });
    }
  };

  // Handle mouse movement; calculate the position relative to the image (not the container)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || !mainImageRef.current) return;
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    // Mouse position relative to the container
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    // Calculate position relative to the actual image (accounting for image offset from the container)
    const relX = x - imageOffsets.offsetX;
    const relY = y - imageOffsets.offsetY;
    // Clamp values so they do not exceed the image boundaries
    const clampedX = Math.max(0, Math.min(relX - viewportBox.width / 2, imageOffsets.imageWidth - viewportBox.width));
    const clampedY = Math.max(0, Math.min(relY - viewportBox.height / 2, imageOffsets.imageHeight - viewportBox.height));
    setMousePosition({ x: clampedX, y: clampedY });
  };

  const calculateCellCounts = () => {
    const counts: Record<string, number> = {};
    detectionResults.forEach((result) => {
      counts[result.label] = (counts[result.label] || 0) + 1;
    });
    return counts;
  };

  const cellCounts = calculateCellCounts();
  const totalCells = detectionResults.length;
  const zoomFactor = 5;

  return (
    <div className="flex min-h-screen bg-gray-100 p-4">
      {/* Left Panel - Patient Data */}
      <div className="w-1/4 bg-white shadow-lg rounded-lg z-10 mr-4 overflow-hidden">
        <div className="bg-blue-600 text-white p-4">
          <h2 className="text-xl font-bold">Patient Information</h2>
        </div>
        <div className="p-4">
          {patientData ? (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-gray-600">Patient ID:</div>
                <div className="font-medium">{patientData.id}</div>
                <div className="text-gray-600">Date:</div>
                <div className="font-medium">{patientData.date}</div>
                <div className="text-gray-600">Sample Type:</div>
                <div className="font-medium">{patientData.sample_type}</div>
              </div>
            </div>
          ) : (
            <p>Loading patient data...</p>
          )}
          <h3 className="text-lg font-semibold mb-3">Cell Counts</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cell Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(cellCounts).map(([cellType, count], index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{cellType}</td>
                    <td className="px-4 py-2">{count}</td>
                    <td className="px-4 py-2">{totalCells > 0 ? ((count / totalCells) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Middle Panel - Whole Slide Image Viewer */}
      <div className="w-2/4 flex flex-col items-center justify-center mr-4">
        <div className="bg-white shadow-lg rounded-lg w-full p-4">
          <h2 className="text-xl font-bold mb-4 text-center">Whole Slide Image</h2>
          <div
            ref={imageContainerRef}
            className="relative border border-gray-300 overflow-hidden rounded-lg"
            style={{ width: '100%', height: '70vh' }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <img
              ref={mainImageRef}
              onLoad={handleImageLoad}
              src={sampleImageUrl}
              alt="Whole Slide Image"
              className="w-full h-full object-cover"
            />
            {detectionResults.map((result, index) => {
              const { x1, y1, x2, y2 } = result;
              return (
                <div
                  key={index}
                  className="absolute border-2 border-red-500 rounded-sm"
                  style={{
                    left: `${x1}px`,
                    top: `${y1}px`,
                    width: `${x2 - x1}px`,
                    height: `${y2 - y1}px`,
                  }}
                />
              );
            })}
            {isHovering && (
              // The hover box position in the container should be offset by the image position
              <div
                className="absolute border-2 border-blue-500 cursor-move bg-blue-100 bg-opacity-20 pointer-events-none"
                style={{
                  left: `${imageOffsets.offsetX + mousePosition.x}px`,
                  top: `${imageOffsets.offsetY + mousePosition.y}px`,
                  width: `${viewportBox.width}px`,
                  height: `${viewportBox.height}px`,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Zoomed View */}
      <div className="w-1/4 bg-white shadow-lg rounded-lg z-10 flex flex-col">
        <div className="bg-blue-600 text-white p-4">
          <h2 className="text-xl font-bold">Zoomed View</h2>
        </div>
        <div className="p-4 flex-grow flex flex-col">
          <div
            className="border border-gray-300 overflow-hidden rounded-lg mb-4 flex-grow"
            style={{ position: 'relative' }}
          >
            <div
              style={{
                width: `${viewportBox.width * zoomFactor}px`,
                height: `${viewportBox.height * zoomFactor}px`,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                className="border border-gray-300 overflow-hidden rounded-lg mb-4"
                style={{
                  width: `${viewportBox.width * zoomFactor}px`,
                  height: `${viewportBox.height * zoomFactor}px`,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${sampleImageUrl})`,
                    backgroundRepeat: 'no-repeat',
                    // For example, the image in the middle panel is displayed with size imageOffsets.imageWidth x imageOffsets.imageHeight
                    backgroundSize: `${imageOffsets.imageWidth * zoomFactor}px ${imageOffsets.imageHeight * zoomFactor}px`,
                    backgroundPosition: `-${mousePosition.x * zoomFactor}px -${mousePosition.y * zoomFactor}px`,
                  }}
                />
              </div>
              {!isHovering && (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Hover over the main image to see zoomed view
                </div>
              )}
              {isHovering &&
                detectionResults.map((result, index) => {
                  const { x1, y1, x2, y2 } = result;
                  const boxX = x1;
                  const boxY = y1;
                  const boxWidth = x2 - x1;
                  const boxHeight = y2 - y1;
                  const viewportLeft = mousePosition.x;
                  const viewportTop = mousePosition.y;
                  const viewportRight = viewportLeft + viewportBox.width;
                  const viewportBottom = viewportTop + viewportBox.height;
                  if (
                    boxX + boxWidth > viewportLeft &&
                    boxX < viewportRight &&
                    boxY + boxHeight > viewportTop &&
                    boxY < viewportBottom
                  ) {
                    return (
                      <div
                        key={index}
                        className="absolute border-2 border-red-500 rounded-sm"
                        style={{
                          left: `${(boxX - viewportLeft) * zoomFactor}px`,
                          top: `${(boxY - viewportTop) * zoomFactor}px`,
                          width: `${boxWidth * zoomFactor}px`,
                          height: `${boxHeight * zoomFactor}px`,
                        }}
                      />
                    );
                  }
                  return null;
                })}
            </div>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg shadow-md w-full font-medium">
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default WholeSlideImageViewer;
