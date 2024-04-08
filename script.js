/* this script renders a preview of an image to be uploaded */
const fileInput = document.querySelector('#photo_upload');
if (fileInput) {
    fileInput.onchange = evt => {
        const [file] = fileInput.files
        if (file) {
            document.querySelector('#upload_preview').src = URL.createObjectURL(file);
            document.querySelector('#upload_source').value = file.name;
        }
    }
}