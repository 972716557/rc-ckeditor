import { uploadFile } from "./service";

class MyUploadAdapter {
  constructor(loader) {
    // The file loader instance to use during the upload.
    this.loader = loader;
  }

  // Starts the upload process.
  upload() {
    return this.loader.file.then((file) => {
      return new Promise((resolve, reject) => {
        let params = new FormData();
        params.append("file", file);
        uploadFile(params)
          .then((res) => {
            const { data } = res;
            resolve({ default: data.fileUrl });
          })
          .catch((error) => {
            reject(error.message);
          });
      });
    });
  }
}

function ImageUploadPlugin(editor) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
    // Configure the URL to the upload script in your back-end here!
    return new MyUploadAdapter(loader);
  };
}

export default ImageUploadPlugin;
