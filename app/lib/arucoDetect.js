let cvLoadPromise = null;

const OPENCV_URL =
  "https://docs.opencv.org/4.9.0/opencv.js";

export function loadOpenCv() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OpenCV runs in browser only"));
  }
  if (window.cv?.Mat) {
    return Promise.resolve(window.cv);
  }
  if (!cvLoadPromise) {
    cvLoadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${OPENCV_URL}"]`);
      if (existing) {
        const wait = () => {
          if (window.cv?.Mat) {
            if (window.cv.aruco) resolve(window.cv);
            else waitForAruco(resolve, reject);
          } else setTimeout(wait, 100);
        };
        wait();
        return;
      }
      const script = document.createElement("script");
      script.src = OPENCV_URL;
      script.async = true;
      script.onload = () => {
        const init = () => {
          if (window.cv?.aruco) resolve(window.cv);
          else waitForAruco(resolve, reject);
        };
        if (window.cv?.Mat) init();
        else window.cv = window.cv || {};
        window.cv.onRuntimeInitialized = init;
      };
      script.onerror = () => reject(new Error("Failed to load OpenCV.js"));
      document.head.appendChild(script);
    });
  }
  return cvLoadPromise;
}

function waitForAruco(resolve, reject, attempts = 0) {
  if (window.cv?.aruco) {
    resolve(window.cv);
    return;
  }
  if (attempts > 50) {
    reject(new Error("OpenCV ArUco module not available in this build"));
    return;
  }
  setTimeout(() => waitForAruco(resolve, reject, attempts + 1), 100);
}

export async function detectArucoMarkers(imageDataUrl) {
  try {
    const cv = await loadOpenCv();
    if (!cv.aruco) return [];

    const img = await dataUrlToImage(imageDataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const mat = cv.matFromImageData(imageData);
    const gray = new cv.Mat();
    cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);

    const dictionary = cv.aruco.getPredefinedDictionary(
      cv.aruco.DICT_4X4_50
    );
    const parameters = new cv.aruco_DetectorParameters();
    const corners = new cv.MatVector();
    const ids = new cv.Mat();

    cv.aruco.detectMarkers(gray, dictionary, corners, ids, parameters);

    const detections = [];
    if (ids.rows > 0) {
      for (let i = 0; i < ids.rows; i++) {
        const markerId = ids.intPtr(i, 0)[0];
        const cornerMat = corners.get(i);
        const cornersList = [];
        for (let j = 0; j < 4; j++) {
          cornersList.push({
            x: cornerMat.floatPtr(0, j * 2)[0],
            y: cornerMat.floatPtr(0, j * 2 + 1)[0],
          });
        }
        detections.push({ markerId, corners: cornersList });
      }
    }

    mat.delete();
    gray.delete();
    dictionary.delete();
    parameters.delete();
    corners.delete();
    ids.delete();

    return detections;
  } catch (err) {
    console.warn("ArUco detection skipped:", err.message);
    return [];
  }
}

function dataUrlToImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}
