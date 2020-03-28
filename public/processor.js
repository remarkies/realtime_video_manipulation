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
        video.addEventListener('loadedmetadata', function() {
            let ratio = video.videoWidth / video.videoHeight;
            this.width = canvas.width = window.innerWidth;
            this.height = canvas.height = window.innerWidth / ratio;

            canvas.setAttribute("style", "top: " + (window.innerHeight - canvas.height) / 2 + "px; display: flex;");
            video.setAttribute("style", "top: " + (window.innerHeight - canvas.height) / 2 + "px; display: flex;");
        });

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

            let l = frame.data.length / 4;

            for (var i = 0; i < l; i++) {
                var grey = (frame.data[i * 4 + 0] + frame.data[i * 4 + 1] + frame.data[i * 4 + 2]) / 3;

                frame.data[i * 4 + 0] = grey;
                frame.data[i * 4 + 1] = grey;
                frame.data[i * 4 + 2] = grey;
            }


            ctx.putImageData(frame, 0, 0);
        }

        return;
    }
};