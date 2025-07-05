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
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("resourceType", resourceType);

      // Upload via backend with progress tracking
      const uploadResult = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            set({ uploadProgress: progress });
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (e) {
              reject(new Error("Invalid response format"));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(
                new Error(
                  errorData.message || `Upload failed with status ${xhr.status}`
                )
              );
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("timeout", () => {
          reject(new Error("Upload timeout"));
        });

        xhr.open(
          "POST",
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
          }/cloudinary/upload`
        );
        xhr.withCredentials = true; // Enable cookies
        xhr.timeout = 300000; // 5 minutes timeout
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
