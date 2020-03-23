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
        this.video = document.getElementById("remoteVideo");
        this.c1 = document.getElementById("remoteCanvas");
        this.ctx1 = this.c1.getContext("2d");
        let self = this;

        this.video.addEventListener("play", function() {
            self.width = self.video.offsetWidth / 12;
            self.height = self.video.offsetHeight / 10;
            self.timerCallback();
        }, false);
    },

    computeFrame: function() {

        if(this.width > 0 && this.height > 0) {
            this.ctx1.drawImage(this.video, 0, 0, this.width, this.height);

            var frame = this.ctx1.getImageData(0, 0, this.width, this.height);

            var l = frame.data.length / 4;

            console.log()
            for (var i = 0; i < l; i++) {
                var grey = (frame.data[i * 4 + 0] + frame.data[i * 4 + 1] + frame.data[i * 4 + 2]) / 3;

                frame.data[i * 4 + 0] = grey;
                frame.data[i * 4 + 1] = grey;
                frame.data[i * 4 + 2] = grey;
            }
            this.ctx1.putImageData(frame, 0, 0);
        }

        return;
    }
};