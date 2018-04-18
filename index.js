
import Ui from './ui'
import Training from './training'

const training = new Training();
training.mnist().then(x => console.log('Training done...'));

const ui = new Ui(function(data) {
    training.predict(data);
});

ui.render();

