let brightness = 10;

let processor = {
    timerCallback: function() {
        if (this.video.paused || this.video.ended) {
            return;
        }
        this.computeFrame();
        var self = this;
        setTimeout(function () {
            self.timerCallback();
        }, 16);
    },

    doLoad: function() {
        var canvas = document.getElementById('remoteCanvas');
        var ctx = canvas.getContext('2d');
        var video = document.getElementById('remoteVideo');
        let self = this;
        // set canvas size = video size when known
        video.addEventListener('loadedmetadata', placeCanvas);
        window.addEventListener('resize', placeCanvas);

        function placeCanvas() {
            let ratio = video.videoWidth / video.videoHeight;
            this.width = canvas.width = window.innerWidth;
            this.height = canvas.height = window.innerWidth / ratio;

            canvas.setAttribute("style", "top: " + (window.innerHeight - canvas.height) / 2 + "px; display: flex;");
            video.setAttribute("style", "top: " + (window.innerHeight - canvas.height) / 2 + "px; display: flex;");
        };

        video.addEventListener('play', function() {
            var $this = this; //cache
            (function loop() {
                if (!$this.paused && !$this.ended) {

                    ctx.drawImage($this, 0, 0, canvas.width, canvas.height);

                    self.computeFrame();

                    setTimeout(loop, 1000 / 16); // drawing at 60fps
                }
            })();
        }, 0);
    },

    computeFrame: function() {

        let canvas = document.getElementById('remoteCanvas');

        if(canvas.width > 0 && canvas.height > 0) {

            let ctx = canvas.getContext('2d');

            let frame = ctx.getImageData(0, 0, canvas.width, canvas.height);

            let pixels = frame.data.length / 4;

            for (let i = 0; i < pixels; i++) {

                let rand = Math.floor(Math.random() * Math.floor(50));

                let r = frame.data[i * 4 + 0];
                let g = frame.data[i * 4 + 1];
                let b = frame.data[i * 4 + 2];

                let noise = 0.5 + (100 / (rand + 1));
                let dif = brightness - ((r + g + b) / 3);

                frame.data[i * 4 + 0] = (r + dif) * noise;
                frame.data[i * 4 + 1] = (g + dif) * noise;
                frame.data[i * 4 + 2] = (b + dif) * noise;

            }
            ctx.putImageData(frame, 0, 0);
        }
    }
};