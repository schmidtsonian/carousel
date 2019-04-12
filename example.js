
import Carousel from './components/carousel.js';

export default class Test extends Carousel {

  constructor($scope) {
    super($scope);
    this.$scope = $scope;
  }

  initConfigHook() {

    const p = new Promise((resolve) => {

      this.namespace = 'carousel-generic';

      resolve();
    });

    return p;
  }

  tweenHook($out, $in, isPrevious, currentItemIndex) {

    const timelineOut = new TimelineMax({paused: true});
    const timelineIn = new TimelineMax({paused: true});

    // Do animations here!


    return new Promise((resolve) => resolve({timelineOut, timelineIn}));
  }
}
