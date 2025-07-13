const sharp = require('sharp');
const fs = require('fs');

document.addEventListener('DOMContentLoaded', function(){
    let mediaArray = [];
    let mediaListForm = document.querySelector("#media-list-form");
    let mediaUpload = document.querySelector(".media-upload");
    let mediaUploadInput = document.querySelector(".media-upload input");
    let mediaPreview = document.querySelector(".media-preview");
    let mediaInfo = document.querySelector(".media-info");
    let selectedIndex = null;
    let toggleVidNet = document.querySelector(".vidnet-toggle");
    let toggleMarquee = document.querySelector(".marquee-toggle");
    let selectedToggle = null;
    let currMessage = "";

    /**
     * div for uploading media files
     */
    mediaUploadInput.addEventListener("change", function() {
        const files = mediaUploadInput.files
        for(let i = 0; i < files.length; i++) {
            mediaArray.push(files[i]); // push files into array
        }
        mediaListForm.reset(); // reset form every time user inputs new images
        displayUploadedMedia();
    })

    /**
     * drag & drop functionality
     */
    mediaUpload.addEventListener("drop", (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files
        for(let i = 0; i < files.length; i++) {
            if(!files[i].type.match("image/png, image/jpeg, image/jpg," + 
                                    "image/gif, video/*")) continue
            if(mediaArray.every(media => media.name !== files[i].name)) {
                mediaArray.push(files[i]);
            }
        }
        displayUploadedMedia();
    })

    /**
     * how entries appear in media list
     */
    function displayUploadedMedia() {
        let displayedMedia = ""
        mediaArray.forEach((media, index) => {
            displayedMedia += `<div class="media-entry">
                    <div class="media-entry-clickable">
                    <div class="media-entry-preview">
                    <img src="${URL.createObjectURL(media)}" alt="media">
                    </div>
                    <div class="media-entry-name">${media.name}
                    </div>
                    </div>
                    <button class="media-entry-delete" data-index="${index}">
                        X
                    </button>
                    </div>`
        })
        mediaListForm.innerHTML = displayedMedia

        // so delete buttons are in scope of this updated html
        let mediaEntryDeleteButtons =
            document.querySelectorAll(".media-entry-delete");
        mediaEntryDeleteButtons.forEach(button => {
            button.addEventListener("click", function(e) {
                e.stopPropagation();
                let index = parseInt(button.getAttribute('data-index'));
                removeMedia(index);
            })
        });

        // so media entries are in scope of this updated html
        let mediaEntries = document.querySelectorAll(".media-entry-clickable");
        mediaEntries.forEach((entry,index) => {
            entry.setAttribute("data-selected","false");
            // video preview functionality
            entry.addEventListener("click", function() {
                selectedIndex = index;
                entry.setAttribute("data-selected","true");
                displaySelectedMedia(index);
            })
        })
    }

    function removeMedia(index) {
        const selectedFile = mediaArray[index]

        // remove off preview
        mediaArray.splice(index, 1);
        if((mediaArray.length == 0) || (selectedIndex == index)) {
            mediaPreview.innerHTML = `<p>empty</p>`
            selectedIndex = null;
        }
        displayUploadedMedia();
    }

    /**
     * function for when media is selected
     */
    async function displaySelectedMedia(index) {
        // file description functionality
        const selectedFile = mediaArray[index]
        if (selectedFile?.type?.match('video/*')) { // video detected
            console.log("video detected");
            displayedPreview =
                `<video src="${URL.createObjectURL(selectedFile)}" alt="media`
                + `preview" controls class="media-preview"></video>`
            const fileMetadata = await getVideoMetadata(selectedFile);
            const fileType = String(fileMetadata.type);
            const videoDimensions = String(fileMetadata.width) + "x" +
                                    String(fileMetadata.height) + " pixels";
            const videoDuration = String(fileMetadata.duration);
            let fileDescription = null;
            if (selectedToggle == "vidnet") {
                console.log(fileMetadata.type);
                fileDescription = getFileDescription(fileMetadata.type,
                                    "video", "vidnet", fileMetadata.width,
                                    fileMetadata.height, null,
                                    fileMetadata.duration);
                mediaInfo.innerHTML = fileDescription.fileDescription;
                let copyMessage = document.querySelector(".copy-message");
                if (copyMessage) {
                    copyMessage.addEventListener("click", () => {
                        navigator.clipboard.writeText
                        (fileDescription.subMessage);
                    })
                }
            }
            else {
                fileDescription = getFileDescription(fileMetadata.type,
                                    "video", "marquee", fileMetadata.width,
                                    fileMetadata.height, null,
                                    fileMetadata.duration);
                mediaInfo.innerHTML = fileDescription.fileDescription;
                let copyMessage = document.querySelector(".copy-message");
                if (copyMessage) {
                    copyMessage.addEventListener("click", () => {
                        navigator.clipboard.writeText
                        (fileDescription.subMessage);
                    })
                }
            }
            mediaPreview.innerHTML = displayedPreview // display media preview
        }
        else if (selectedFile?.type?.match('image/*')){ // image detected
            
            console.log("image detected");
            displayedPreview =
            `<img src="${URL.createObjectURL(selectedFile)}" alt="image"><img>`
            const fileMetadata = await getImageMetadata(index);
            const fileType = String(fileMetadata.format);
            const imgDimensions = String(fileMetadata.width) + "x" +
                                    String(fileMetadata.height) + " pixels";
            const imgDPI = String(fileMetadata.density) + "DPI";
            let fileDescription = null;
            if (selectedToggle == "vidnet") {
                fileDescription = getFileDescription(fileMetadata.format,
                                    "image", "vidnet", fileMetadata.width,
                                    fileMetadata.height, fileMetadata.density,
                                    null);
                mediaInfo.innerHTML = fileDescription.fileDescription;
                let copyMessage = document.querySelector(".copy-message");
                if (copyMessage) {
                    copyMessage.addEventListener("click", () => {
                        navigator.clipboard.writeText
                        (fileDescription.subMessage);
                    })
                }
            }
            else {
                fileDescription = getFileDescription(fileMetadata.format,
                                    "image", "marquee", fileMetadata.width,
                                    fileMetadata.height, fileMetadata.density,
                                    null);
                mediaInfo.innerHTML = fileDescription.fileDescription
                let copyMessage = document.querySelector(".copy-message");
                if (copyMessage) {
                    copyMessage.addEventListener("click", () => {
                        navigator.clipboard.writeText
                        (fileDescription.subMessage);
                    })
                }
            }
            mediaPreview.innerHTML = displayedPreview // display media preview
        }
        else {
            console.log("nothing to display or entry has been removed");
        }
    }

    async function getImageMetadata(index) {
        const file = mediaArray[index];
        const arrayBuffer = await file.arrayBuffer(); // from File API
        const buffer = Buffer.from(arrayBuffer); // convert to Node.js Buffer
        const metadata = await sharp(buffer).metadata();
        return metadata;
    }

    async function getVideoMetadata(file, callback) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = URL.createObjectURL(file);
            video.muted = true;

            video.addEventListener('loadedmetadata', () => {
                URL.revokeObjectURL(video.src);
                const type = file.name.split('.').pop().toLowerCase();
                const width = video.videoWidth;
                const height = video.videoHeight;
                const duration = video.duration;
                resolve({type,width,height,duration});
            });

            video.onerror = () => {
                reject("Unable to retrieve video dimensions.");
            };
        });
    }

    /**
     * file description and submission message function
     */
    function getFileDescription(fileType, mediaType, subType, width, height,
                                dpi, duration) {
        let subMessage = "";
        let fileDescription = ``;
        /**
         * VIDEO CASES
         * if vidnet: if 1920x1080 pixels: accept, else: reject
         * if marquee: if 840x144 pixels: accept, else: reject
         */
        if (mediaType == "video") {
            if (subType == "vidnet") {
                if ((width == 1920) && (height == 1080)) {
                    subMessage = "Your submission has been accepted and will" +
                                " be scheduled to run on the Price Center TV" +
                                " screens."
                }
                else {
                    subMessage = "Please make sure your submission is 1920x" +
                                "1080 pixels as per our specifications. Your" +
                                " submission is " + width + "x" + height
                                + " pixels."
                }
                fileDescription = `File Type: Video (.${fileType}) <br>
                                Video Dimensions: ${width}x${height} pixels 
                                <br> Video Duration: ${duration}<br>
                                Message <button class="copy-message"> 
                                </button>: ${subMessage}`;
            }
            else {
                if ((width == 840) && (height == 144)) {
                    subMessage = "Your submission has been accepted and will" +
                                " be scheduled to run on the Price Center" +
                                " marquee."
                }
                else {
                    subMessage = "Please make sure your submission is 840x" +
                                "144 pixels as per our specifications. Your" +
                                " submission is " + width + "x" + height
                                + " pixels."
                }
                fileDescription = `File Type: Video (.${fileType}) <br>
                                Video Dimensions: ${width}x${height} pixels 
                                <br> Video Duration: ${duration}<br>
                                Message <button class="copy-message"> 
                                </button>: ${subMessage}`;
            }
        }
        
        /**
         * IMAGE CASES
         * if vidnet: if 1920x1080 pixels and 72 DPI: accept,
         *      else if 1920x1080 pixels not 72 DPI: reject and inform DPI,
         *      else if not 1920x1080 pixels: reject
         * if marquee: if 840x144 pixels: accept, else: reject
         */
        else {
            if (subType == "vidnet") {
                if (((width == 1920) && (height == 1080) && (dpi == 72)) || 
                    ((width == 1920) && (height == 1080) && 
                    (fileType == "gif"))) {
                    subMessage = "Your submission has been accepted and will" +
                                " be scheduled to run on the Price Center TV" +
                                " screens."
                }
                else {
                    subMessage = "Please make sure your submission is 1920x" +
                                "1080 pixels and 72 DPI as per our" +
                                " specifications. Your submission is " + width
                                + "x" + height + " pixels and " + dpi + " DPI."
                }
                if (fileType == "gif") { // gif doesn't have DPI
                    fileDescription = `File Type: Image (.${fileType}) <br>
                                Image Dimensions: ${width}x${height} pixels 
                                <br> Message <button class="copy-message"> 
                                </button>: ${subMessage}`;

                }
                else {
                    fileDescription = `File Type: Image (.${fileType}) <br>
                                Image Dimensions: ${width}x${height} pixels 
                                <br> Image DPI: ${dpi} DPI<br> Message 
                                <button class="copy-message"> </button>: 
                                ${subMessage}`;
                }
            }
            else {
                if ((width == 840) && (height == 144)) {
                    subMessage = "Your submission has been accepted and will" +
                                " be scheduled to run on the Price Center" +
                                " marquee."
                }
                else {
                    subMessage = "Please make sure your submission is 840x" +
                                "144 pixels as per our specifications. Your" +
                               " submission is " + width + "x" + height
                               + " pixels."
                }
                fileDescription = `File Type: Image (.${fileType}) <br>
                                Image Dimensions: ${width}x${height} pixels 
                                <br> Message <button class="copy-message"> 
                                </button>: ${subMessage}`;
            }
        }
        return {fileDescription, subMessage};
    }

    /**
     * vidnet toggle function
     */
    toggleVidNet.addEventListener("click", () => {
        selectedToggle = "vidnet";
        displaySelectedMedia(selectedIndex);
    })
    
    /**
     * marquee toggle function
     */
    toggleMarquee.addEventListener("click", () => {
        selectedToggle = "marquee";
        displaySelectedMedia(selectedIndex);
    })
});