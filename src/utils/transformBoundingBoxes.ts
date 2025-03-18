type DetectionResult = [number, number, number, number, string];

interface InferenceOutput {
  detection_results: DetectionResult[];
}

interface InferenceResults {
  delayTime: number;
  executionTime: number;
  id: string;
  output: InferenceOutput;
}

export function transformBoundingBoxes(inferenceResults: string | InferenceResults) {
    try {
      const parsedResults: InferenceResults = typeof inferenceResults === "string"
        ? JSON.parse(inferenceResults.replace(/'/g, '"'))
        : inferenceResults;
  
      if (!parsedResults?.output?.detection_results) {
        throw new Error("Invalid inference results format");
      }
  
      return parsedResults.output.detection_results.map(([x1, y1, x2, y2, label]: DetectionResult) => ({
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
        label,
      }));
    } catch (error) {
      console.error("Error transforming bounding boxes:", error);
      return [];
    }
}
  
  