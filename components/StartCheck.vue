<template>
  <div style="position: relative;">
    <v-layout row justify-center style="height: 152px">
      <!-- Initial State -->
      <transition-group tag="div" name="overlay" class="layout row justify-center">
        <div
          v-if="!loading"
          v-for="(n, i) in items"
          :key="`system-${i}`"
          class="mx-2"
        >
          <img :src="n.src">
        </div>
      </transition-group>
      
      <!-- Checking Hardware -->
      <transition-group tag="div" name="slide" mode="out-in"">
        <div
          :class="{shuffle: !starting}"
          v-for="n in [currentImg]"
          :key="`check-system-${n}`"
          v-if="loading && !starting"
        >
          <img :src="items[Math.abs(currentImg) % items.length].src">

        </div>
      </transition-group>
    </v-layout>
    <!-- Starting Test -->
    <v-layout row justify-center class="starting">
      <transition name="slide">
        <div v-if="loading && starting">
          <img src="/static/icons/svg/starting.svg" alt="">
        </div>
      </transition>
    </v-layout>
  </div>
</template>
<script>
export default {
  name: 'StartCheckIcon',
  props: ['items', 'step', 'loading', 'starting'],
  data() {
    return {
      currentImg: 0,
      timer: {},
    };
  },
  watch: {
    starting(val) {
      if (!val) {
        this.timer = setInterval(() => {
          this.currentImg = this.currentImg + 1;
        }, 3000);
      }
    },
    loading(val) {
      if (!val) {
        clearTimeout(this.timer);
      }
    },
  },
};
</script>
<style lang="scss" scoped>
  @import '~@/styles/index';

  .shuffle {
    top: 0px;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .slide-leave-active,
  .slide-enter-active {
    transition: 1s;
  }
  .slide-enter {
    transform: translateX(40px);
    opacity: 1;
  }
  .slide-leave-to {
    transform: translateX(-40px);
    opacity: 0;
  }

  .starting {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: -18px;

    img {
      width: 152px;
      height: 152px;
      opacity: 1;
      transition: opacity .25s ease-in-out;
    }
  }

  img {
    width: 120px;
    height: 120px;
    opacity: 1;
    transition: opacity .25s ease-in-out;
  }

  .overlay-leave-active {
    transition: transform .25s ease-in-out;
  }
  .overlay-leave-to {
    &:nth-child(1) {
      transform: translateX(179px);
    }
    &:nth-child(2) {
      transform: translateX(59px);
    }
    &:nth-child(3) {
      transform: translateX(-61px);
    }
    &:nth-child(4) {
      transform: translateX(-181px);
    }
  }
</style>
