import * as tf from '@tensorflow/tfjs';

import {MnistData} from './data';

export default class Training {

  constructor () {
    this._initModel();
  }

  _initModel = () => {

    // Sequentielles Modell. Ausgabe eines Layers ist Eingabe des nächsten.
    this.model = tf.sequential();

    // Erster Layer: Convolutional 2D  
    this.model.add(tf.layers.conv2d({
      inputShape: [28, 28, 1], //28x28 Pixel One Hot Encoded
      kernelSize: 5, // Fenster ist 5 x 5 Pixel
      filters: 8, // Anzahl Schichten
      strides: 1, // wandert 1px pro Aufruf
      activation: 'relu',
      kernelInitializer: 'varianceScaling'
    }));

    // Pooling: Reduktion der Features jeder Schicht
    this.model.add(tf.layers.maxPooling2d({
      poolSize: [2, 2], // Reduziert einen 2 x 2 Pixel Bereich
      strides: [2, 2] // wandert 2 x 2 Pixel pro Schritt
    }));

    // Weiterer Convolutional Layer
    this.model.add(tf.layers.conv2d({
      kernelSize: 5, // Fenster ist wieder 5 x 5 Pixel
      filters: 16, // Diesmal 16 Schichten
      strides: 1, // wandert 1px pro Aufruf
      activation: 'relu',
      kernelInitializer: 'varianceScaling'
    }));

    // Erneutes Subsampling durch Pooling
    this.model.add(tf.layers.maxPooling2d({
      poolSize: [2, 2], 
      strides: [2, 2]
    }));

    // Reduktion der Features auf eine Dimensions
    this.model.add(tf.layers.flatten());

    // Layer für die Wahrscheinlichkeitsberechnung
    this.model.add(tf.layers.dense({
      units: 10, // Anzahl der Outputs (Zahlen von 0 bis 9)
      kernelInitializer: 'varianceScaling', 
      activation: 'softmax'
    }));
    
    // Parameter fürs Lernen
    const LEARNING_RATE = 0.15; // Geschwindigkeit
    const optimizer = tf.train.sgd(LEARNING_RATE); // Beschreibung des Gradients

    this.model.compile({
      optimizer: optimizer, // Optimierung mithilfe des Gradients
      loss: 'categoricalCrossentropy', // Wir verwenden Cross Entropy für den Loss
      metrics: ['accuracy'] // und bewerten anhand von Accuracy
    });    
  }

  async train () {
    const BATCH_SIZE = 64;
    const NUMBER_OF_TRAINING_BATCHES = 150;
    const TEST_BATCH_SIZE = 1000;
    const TEST_ITERATION_FREQUENCY = 5;

    const lossValues = [];
    const accuracyValues = [];

    for (let trainingIterationIndex = 0; trainingIterationIndex < NUMBER_OF_TRAINING_BATCHES; trainingIterationIndex++) {
      const batch = this.data.nextTrainBatch(BATCH_SIZE);

      let testBatch;
      let validationData;
      
      if (trainingIterationIndex % TEST_ITERATION_FREQUENCY === 0) {
        testBatch = this.data.nextTestBatch(TEST_BATCH_SIZE);
        validationData = [
          testBatch.xs.reshape([TEST_BATCH_SIZE, 28, 28, 1]), testBatch.labels
        ];
      }

      // Hier geben wir die Daten zum Lernen an das Modell
      const history = await this.model.fit(
          batch.xs.reshape([BATCH_SIZE, 28, 28, 1]), // Die Daten
          batch.labels, // Die bekannten Label
          { batchSize: BATCH_SIZE, validationData, epochs: 1 });

      const loss = history.history.loss[0];
      const accuracy = history.history.acc[0];

      // loss / accuracy.
      lossValues.push({'batch': trainingIterationIndex, 'loss': loss, 'set': 'train'});

      if (testBatch != null) {
        accuracyValues.push({'batch': trainingIterationIndex, 'accuracy': accuracy, 'set': 'train'});
        console.log(accuracy);
      }

      batch.xs.dispose();
      batch.labels.dispose();
      if (testBatch != null) {
        testBatch.xs.dispose();
        testBatch.labels.dispose();
      }

      await tf.nextFrame();
    }
  }

  async showPredictions() {
    const testExamples = 100;
    const batch = this.data.nextTestBatch(testExamples);

    tf.tidy(() => {
      const output = this.model.predict(batch.xs.reshape([-1, 28, 28, 1]));

      const axis = 1;
      const labels = Array.from(batch.labels.argMax(axis).dataSync());
      const predictions = Array.from(output.argMax(axis).dataSync());

      console.log('training and testing done');
    });
  }

  async predict (dataArray) {
    tf.tidy(() => {

      // Hier wandeln wir unsere Daten in einen Tensor um
      const input = tf.tensor2d(dataArray, [28, 28]).reshape([-1, 28, 28, 1]);
      // ... und geben sie zur Vorhersage an das Model.
      const output = this.model.predict(input);

      // Hier geben wir die Zahl mit der höchsten Wahrscheinlichkeit aus
      console.log(Array.from(output.argMax(1).dataSync()));
      
      // Hier können wir alle Wahrscheinlichkeiten für die Zahlen von 0 bis 9 sehen
      //console.log(output.dataSync());
    });
  }  

  async load() {
    this.data = new MnistData();
    await this.data.load();
  }

  async mnist() {
    await this.load();
    await this.train();
    this.showPredictions();
  }
}