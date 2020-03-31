
let brightness = 15;

function updateBrightness(val) {
    brightness = val;
}

let processor = {
    timerCallback: function() {
        if (this.video.paused || this.video.ended) {
            return;
        }
        this.computeFrame();
        let self = this;
        setTimeout(function () {
            self.timerCallback();
        }, 16);
    },
    doLoad: function() {
        let canvas = document.getElementById('remoteCanvas');
        let ctx = canvas.getContext('2d');
        let video = document.getElementById('remoteVideo');
        let self = this;

        video.addEventListener('loadedmetadata', placeCanvas);
        video.addEventListener('play', function() {

            //cache
            let $this = this;

            (function loop() {
                if (!$this.paused && !$this.ended) {

                    ctx.drawImage($this, 0, 0, canvas.width, canvas.height);

                    //processing
                    self.computeFrame();

                    // drawing at 60fps
                    setTimeout(loop, 1000 / 16);
                }
            })();
        }, 0);

        window.addEventListener('resize', placeCanvas);

        //place canvas right over video element
        function placeCanvas() {

            //video proportions
            let ratio = video.videoWidth / video.videoHeight;
            canvas.width = window.innerWidth;

            //calculate height of canvas
            canvas.height = window.innerWidth / ratio;

            //display canvas in the middle of the screen
            canvas.setAttribute("style", "top: " + (window.innerHeight - canvas.height) / 2 + "px; display: flex;");
            video.setAttribute("style", "top: " + (window.innerHeight - canvas.height) / 2 + "px; display: flex;");
        };
    },
    computeFrame: function() {

        let canvas = document.getElementById('remoteCanvas');

        if(canvas.width > 0 && canvas.height > 0) {

            let ctx = canvas.getContext('2d');

            //take frame from canvas
            let frame = ctx.getImageData(0, 0, canvas.width, canvas.height);

            //pixel has 4 values (r,g,b,0)
            let pixels = frame.data.length / 4;

            for (let i = 0; i < pixels; i++) {
                let r = frame.data[i * 4 + 0];
                let g = frame.data[i * 4 + 1];
                let b = frame.data[i * 4 + 2];

                //get random number between 0 & 5
                let rand = Math.floor(Math.random() * Math.floor(5));

                //noise strength to manipulate rgb-values
                let noise = 0.5 + (10 / (rand + 1));

                //difference to avg brightness
                let dif = brightness - ((r + g + b) / 3);

                //manipulate frame
                frame.data[i * 4 + 0] = (r + dif) * noise;
                frame.data[i * 4 + 1] = (g + dif) * noise;
                frame.data[i * 4 + 2] = (b + dif) * noise;
            }

            //update frame on canvas
            ctx.putImageData(frame, 0, 0);
        }
    }
};