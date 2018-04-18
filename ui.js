
export default class Ui {

  constructor (exportCallback) {
    this.isDrawing = false;
    this.touchPosition = null;
    this.lastPosition = null;

    this._createCanvasElement();
    this._createDoneButton();
    this._createClearButton();

    this.exportCallback = exportCallback;
  }

  _createCanvasElement = () => {

    let element = document.createElement('canvas');
    element.id = 'canvas';
    element.width = 28;
    element.height = 28;

    element.addEventListener("touchstart", e => this._onStartDrawing(e), false);
    element.addEventListener("touchend", this._onStopDrawing, false);
    element.addEventListener("touchmove", this._onMoving, false);

    this.context = element.getContext("2d");
    this.context.scale(1, 1);
    this.context.strokeStyle = "#000";
    this.context.lineWidth = 1;

    this.canvasElement = element;

    var bodyEventOptions = { capture: false, passive: false };
    document.body.addEventListener("touchstart", this._preventOnCanvas, bodyEventOptions);
    document.body.addEventListener("touchend", this._preventOnCanvas, bodyEventOptions);
    document.body.addEventListener("touchmove", this._preventOnCanvas, bodyEventOptions);

    document.body.appendChild(element);
  }

  _createDoneButton = () => {
    let doneButton = document.createElement('button');
    doneButton.innerHTML = 'Done';
    doneButton.id = 'export-button';
    doneButton.addEventListener('click', this._onDoneClicked);
    document.body.appendChild(doneButton);    
  }

  _createClearButton = () => {
    let doneButton = document.createElement('button');
    doneButton.innerHTML = 'Clear';
    doneButton.id = 'clear-button';
    doneButton.addEventListener('click', this._onClearClicked);
    document.body.appendChild(doneButton);      
  }

  _onClearClicked = () => {
    this.canvasElement.width = this.canvasElement.width;    
  }

  _onDoneClicked = () => {
      const imagedata = this.context.getImageData(0, 0, 28, 28);
      const pixelData = imagedata.data;

      let data = [];

      for (let pixelIndex = 0, numberOfPixels = pixelData.length; pixelIndex < numberOfPixels; pixelIndex += 4) {

          var isBlack = pixelData[pixelIndex] === 0 && pixelData[pixelIndex+1] === 0 && pixelData[pixelIndex+2] === 0 && pixelData[pixelIndex+3] !== 0;
          data.push(isBlack ? 1 : 0);
      }

      this.exportCallback(data);    
  }

  _preventOnCanvas = (event) => {
    if (event.target == this.canvasElement) {
        event.preventDefault();
    }
  }

  _onStartDrawing = (event) => {   
    this.touchPosition = this._getTouchPosition(this.canvasElement, event);
    this.isDrawing = true;
  }

  _onStopDrawing = (event) => {
      this.isDrawing = false;
      this.lastPosition = null;
  }

  _onMoving = (event) => {
      this.touchPosition = this._getTouchPosition(this.canvasElement, event);
  }

  _getTouchPosition = (canvasDom, touchEvent) => {
    var rect = canvasDom.getBoundingClientRect();
    var event = touchEvent.touches[0];
    return {
        x: (event.clientX - rect.left) / (rect.right - rect.left) * this.canvasElement.width,
        y: (event.clientY - rect.top) / (rect.bottom - rect.top) * this.canvasElement.height
    };
  }

  _drawOnCanvas = () => {
    if (this.isDrawing) {
      const sourcePosition = this.lastPosition !== null ? this.lastPosition : this.touchPosition;

      this.context.moveTo(sourcePosition.x, sourcePosition.y);
      this.context.lineTo(this.touchPosition.x, this.touchPosition.y);
      this.context.stroke();

      this.lastPosition = this.touchPosition;
    }
  }

  _drawLoop = () => {
    requestAnimFrame(this._drawLoop);
    this._drawOnCanvas();
  };

  render = () => {

    window.requestAnimFrame = (function (callback) {
        return window.requestAnimationFrame || 
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimaitonFrame ||
        function (callback) {
            window.setTimeout(callback, 1000/60);
        };
    })();  

    this._drawLoop();
  } 
}