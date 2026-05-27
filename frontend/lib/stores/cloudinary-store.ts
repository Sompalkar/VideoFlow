import { create } from "zustand";

interface CloudinaryState {
  uploadProgress: number;
  isUploading: boolean;
  error: string | null;
  uploadToCloudinary: (
    file: File,
    resourceType: "video" | "image"
  ) => Promise<any>;
  clearError: () => void;
}

export const useCloudinaryStore = create<CloudinaryState>((set) => ({
  uploadProgress: 0,
  isUploading: false,
  error: null,

  uploadToCloudinary: async (file: File, resourceType: "video" | "image") => {
    set({ isUploading: true, uploadProgress: 0, error: null });

    try {
      // 1. Get signature from backend
      const signatureResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/cloudinary/signature`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ resourceType }),
          // Important: include credentials so authenticate middleware works
          credentials: "include"
        }
      );

      if (!signatureResponse.ok) {
        throw new Error("Failed to get upload signature from server");
      }

      const { signature, timestamp, cloudName, apiKey, folder } = await signatureResponse.json();

      // 2. Create FormData for direct Cloudinary upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);
      
      // Add chunking options for large files if needed
      // Note: For true chunking (upload_large), we need the Cloudinary JS SDK.
      // But standard direct upload handles up to 100MB fine and bypasses Nginx.

      // 3. Upload directly to Cloudinary with progress tracking
      const uploadResult = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            set({ uploadProgress: progress });
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              // Format result to match what the app expects from our old backend upload
              resolve({
                success: true,
                data: {
                  publicId: result.public_id,
                  url: result.secure_url,
                  width: result.width,
                  height: result.height,
                  format: result.format,
                  bytes: result.bytes,
                  duration: result.duration,
                }
              });
            } catch (e) {
              reject(new Error("Invalid response format from Cloudinary"));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error?.message || `Upload failed with status ${xhr.status}`));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during direct Cloudinary upload"));
        });

        xhr.addEventListener("timeout", () => {
          reject(new Error("Upload timeout"));
        });

        xhr.open(
          "POST",
          `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
        );
        // Do NOT set withCredentials for Cloudinary direct upload (CORS will fail)
        xhr.timeout = 600000; // 10 minutes timeout for large files
        xhr.send(formData);
      });

      set({ isUploading: false, uploadProgress: 100 });
      return uploadResult;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Upload failed",
        isUploading: false,
        uploadProgress: 0,
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
