import _ from 'lodash';
import 'hammerjs';

require('gsap/TimelineMax');
require('gsap/TweenMax');

class Carousel {

  constructor() {

    //Configuration
    this.namespace = '';
    this.$scope = null;

    //Elements
    this.$$ = {};

    this.helpers = {
      classNameActive: 'is-active',
      classNameOut   : 'is-out',
      classNameIn    : 'is-in',

      classDisabled  : 'is-disabled'
    };

    this.currentItemIndex = 0;
    this.isAnimating = false;
    this.totalItems = 0;
    this.isPaning = false;

    this.initX = 0;
    this.tweenDuration = 1;
    this.easing = Sine.easeInOut;
  }

  _cacheElements() {

    this.$$ = {
      prev : $('.js-carousel__bt--prev', this.$scope),
      next : $('.js-carousel__bt--next', this.$scope),
      bullet: $('.js-carousel__bullet', this.$scope),
      items: $('.js-carousel__item', this.$scope),
    };
    this.totalItems = this.$$.items.length;

    this.hamerManager = new Hammer.Manager(this.$scope[0], {touchAction: 'pan-y'});
    this.hamerManager.add(new Hammer.Pan());

    return this;
  }

  _bindings() {

    const {$$, helpers, namespace, hamerManager} = this;

    const _setPaningFalse = _.debounce(() => {
      this.isPaning = false;
    }, 500);
    hamerManager.on('panstart pancancel panend panleft panright', (e) => {

      e.preventDefault();

      switch (e.type) {
      case 'swipeleft':
        this._onNext();
        break;
      case 'swiperight':
        this._onPrev();
        break;
      case 'panleft':
        this._onNext();
        break;
      case 'panright':
        this._onPrev();
        break;
      case 'panstart':
        // this.initX = e.center.x;
        this.isPaning = true;
        break;
      case 'pancancel':
        _setPaningFalse();
        break;
      case 'panend':
        _setPaningFalse();
        break;
      default:
        break;
      }
    });

    $$.prev.on('click.' + namespace, (e) => {
      e.preventDefault();
      this._onPrev();
    });

    $$.next.on('click.' + namespace, (e) => {
      e.preventDefault();
      this._onNext();
    });

    if ($$.bullet.length > 0) {
      _.each($$.bullet, (e, i) => {

        $(e).on('click.' + namespace, () => {

          if (i !== this.currentItemIndex) {
            this._pullItemByIndex(i, false);
          }
        });
      });

      $$.bullet.eq(0).addClass(helpers.classNameActive);
    }

    $$.items.on('click.' + namespace, (e) => {

      if (this.isPaning) {
        e.preventDefault();
      }
    });

    $$.items.eq(0).addClass(helpers.classNameActive);

    return this;
  }

  _validateNextIndex(index) {

    const {totalItems} = this;

    let nextIndex = index < 0 ? totalItems - 1 : index;
    nextIndex = index >= totalItems ? 0 : nextIndex;
    return nextIndex;
  }

  _initTriggers() {
    this.initTriggersHook();
    return this;
  }

  _pullItemByIndex(index, isPrevious) {

    const {helpers, $$} = this;

    const p  = new Promise((resolve) => {

      if (this.isAnimating) {
        resolve();
      } else {

        this.isAnimating = true;

        // index item OUT
        const prevItem = this.currentItemIndex;
        // index item IN
        this.currentItemIndex = this._validateNextIndex(index);
        // items
        const $itemOut = $$.items.eq(prevItem);
        const $itemIn = $$.items.eq(this.currentItemIndex);

        $itemOut.addClass(helpers.classNameOut);
        $itemIn.addClass(helpers.classNameIn);

        this
          ._tween($itemOut, $itemIn, isPrevious)
          .then(() => {

            $itemOut.removeClass(helpers.classNameOut);
            $itemIn.removeClass(helpers.classNameIn);

            $$.items.removeClass(helpers.classNameActive);
            $itemIn.addClass(helpers.classNameActive);

            if ($$.bullet.length > 0) {

              $$.bullet.removeClass(helpers.classNameActive);
              $$.bullet.eq(this.currentItemIndex).addClass(helpers.classNameActive);
            }

            this.isAnimating = false;
            resolve();
          });
      }
    });
    return p;
  }

  _initConfig() {

    const p = new Promise((resolve, reject) => {

      this
        .initConfigHook()
        .then(() => {
          if (this.$scope && this.$scope.length === 0) {
            reject();
          } else {
            resolve();
          }
        });

    });
    return p;
  }

  _tween($out, $in, isPrevious) {

    const {tweenDuration, easing} = this;

    const p = new Promise((resolve) => {
      this
        .tweenHook($out, $in, isPrevious, this.currentItemIndex)
        .then((obj) => {

          const progress = {time: 0};

          TweenMax.to( progress, tweenDuration, {time: 1,
            onUpdate: () => {

              const pr = Math.round( progress.time * 10 ) / 10;

              this._setProgressToTimeline(obj.timelineIn, pr);
              this._setProgressToTimeline(obj.timelineOut, pr);
            },
            ease: easing,
            onComplete: function () {

              resolve();
            }
          });
        });
    });
    return p;
  }

  // eslint-disable-next-line
  _setProgressToTimeline(tl, progress) {
    tl.pause();
    tl.progress(progress);
  }

  _onPrev() {

    if (this.prevHook()) {
      this._pullItemByIndex(this.currentItemIndex - 1, true);
    }
  }

  _onNext() {

    if (this.nextHook()) {
      this._pullItemByIndex(this.currentItemIndex + 1, false);
    }
  }

  tweenHook($out, $in, isPrevious, currentIndex) {

    return new Promise((resolve) => {

      console.log($out, $in, isPrevious, currentIndex, this);
      const timelineOut = new TimelineMax({paused: true});
      const timelineIn = new TimelineMax({paused: true});

      timelineOut
        .set($out, {css:{'display': 'block', 'opacity': 1}} )
        .to($out, 1, {css: {'opacity': 0}})
        .set($out, {css:{'display': 'none'}});

      timelineIn
        .set($in, {css:{'display': 'block', 'opacity': 1}})
        .to($in, 1, {css: {'opacity': 1}});

      resolve({timelineOut, timelineIn});
    });
  }

  initConfigHook() {

    const p = new Promise((resolve) => {

      this.$scope = $('#js-carousel');
      this.namespace = 'carousel';
      resolve();
    });
    return p;
  }

  initTriggersHook() {
    return this;
  }

  nextHook() {
    return this;
  }

  prevHook() {
    return this;
  }

  clearElements() {

    const {namespace} = this;

    const p = new Promise((resolve) => {

      if (this.$scope && this.$scope.length > 0 ) {

        this.$$.prev.unbind('click.' + namespace);
        this.$$.next.on('unbind.' + namespace);

        if (this.$$.bullet.length > 0) {
          _.each(this.$$.bullet, (e) => {
            $(e).unbind('click.' + namespace);
          });
        }

        this.currentItemIndex = 0;
        this.isAnimating = false;
        this.totalItems = 0;
        this.$scope = null;
      }
      resolve();
    });
    return p;
  }

  init() {

    const p = new Promise((resolve) => {

      this
        ._initConfig()
        .then(
          () => {
            this._cacheElements();
            this._bindings();
            this._initTriggers();
            resolve();
          },
          () => resolve()
        );
    });
    return p;
  }
}

export default Carousel;
