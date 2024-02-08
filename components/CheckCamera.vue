<template>
  <div>
    <div id="accessOverlay" v-if="showOverlay">
      <div
        class="arrow"
        :class="{'safari': browser.toLowerCase() === 'safari', 'chrome': browser.toLowerCase() === 'chrome'}"
      >
        <v-icon dark large>reply</v-icon>
        <div>{{ $t('callcheck.overlay.access') }}</div>
      </div>
    </div>
    <v-card>
      <v-card-text>
        <v-container grid-list-md>
          <v-layout row align-center>
            <v-flex xs3 class="overlay">
              <v-img
                :src="data.src"
                height="120px"
                contain
              ></v-img>
              <v-icon
                color="secondary"
                class="icon-result"
                v-if="data.data.hasDevice && !data.error"
                large
              >check_circle</v-icon>
              <v-icon
                color="error"
                class="icon-result"
                v-else
                large
              >cancel</v-icon>
            </v-flex>

            <v-flex xs3>
              <h4 class="title">Video</h4>
              <v-flex v-if="!data.error">
                <v-select
                  :items="data.data.deviceList"
                  v-model="cameraId"
                  item-text="label"
                  item-value="deviceId"
                  height="26"
                >
                  <template
                    slot="selection"
                    slot-scope="{ item, index }"
                  >
                    {{item.label | truncate(18)}}
                  </template>
                </v-select>
              </v-flex>
              <p v-else>
                {{ this.data.error_text }}
              </p>
            </v-flex>
            <v-flex xs2 class="mx-auto">
              <div class="camera-block ma-auto" ref="camera"></div>
            </v-flex>
            <v-flex xs3 pr-4>
              <div v-if="!video && !data.error" class="text-xs-center">
                <div>
                  <v-progress-circular
                    :size="24"
                    :width="3"
                    color="secondary"
                    indeterminate
                  ></v-progress-circular>
                </div>
                <h4 class="mt-2">{{$t('callcheck.label.test')}}</h4>
              </div>
              <div v-if="video && !data.error">
                <p>
                  {{$t('callcheck.quality.video')}}
                  <span class="quality-text" :class="{'error--text': video.mos <= 2.3, 'warning--text': video.mos <= 2.4, 'success--text': video.mos >= 3.1}">
                    {{video.mos.toFixed(1)}}
                  </span> / 4.5
                  <span class="quality-text" :class="{'error--text': video.mos <= 2.3, 'warning--text': video.mos <= 2.4, 'success--text': video.mos >= 3.1}">
                    {{rateMos(video.mos)}}
                  </span>
                </p>
                <v-progress-linear
                  color="success"
                  height="17"
                  :value="mosLevel"
                ></v-progress-linear>
              </div>
              <ArticleDialog v-if="data.error" :content-key="'CALLCHECK_'.data.error" :btn="$t('callcheck.camera.btn.label')"/>
            </v-flex>
          </v-layout>
        </v-container>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex';

  import { truncate } from '@/shared/filters/DataFilter'; // eslint-disable-line
  import OT from '@opentok/client';

  import ArticleDialog from './DialogWithArticle';
  // import VvArrowIcon from '@/shared/components/ArrowIcon';

  export default {
    name: 'CheckCamera',
    props: ['data', 'browser'],
    components: {
      ArticleDialog,
    },
    data() {
      return {
        cameraId: '',
        cameraPublisher: null,
        showOverlay: false,
      };
    },
    methods: {
      createPublisher(deviceId) {
        if (this.cameraPublisher) {
          this.cameraPublisher.destroy();
        }
        this.showOverlay = true;
        this.cameraPublisher = OT.initPublisher(this.$refs.camera, {
          videoSource: deviceId,
          audioSource: false,
          width: '100%',
          height: '100%',
          insertMode: 'append',
        }, () => {
          /* @todo need to check place a little be nicer */
          this.showOverlay = false;
        });
      },
      rateMos(mos) {
        if (mos >= 3.8) {
          return this.$t('callcheck.quality.excellent');
        }
        if (mos >= 3.1) {
          return this.$t('callcheck.quality.good');
        }
        if (mos >= 2.4) {
          return this.$t('callcheck.quality.fair');
        }
        if (mos >= 1.7) {
          return this.$t('callcheck.quality.poor');
        }

        return this.$t('callcheck.quality.bad');
      },
    },
    computed: {
      ...mapGetters('callcheck', {
        video: 'getVideo',
      }),
      mosLevel() {
        return Math.floor(this.video.mos / 4.5 * 100); // eslint-disable-line
      },
    },
    watch: {
      cameraId(val) {
        this.createPublisher(val);
      },
    },
    mounted() {
      // does not exist if there is no camera connected;
      this.cameraId = this.data.data.deviceList[0] ? this.data.data.deviceList[0].deviceId : null;
    },
    beforeDestroy() {
      if (this.cameraPublisher) {
        this.cameraPublisher.destroy();
      }
    },
  };
</script>
<style lang="scss" scoped>
  .camera-block {
    width: 100px;
    height: 100px;
  }

  .quality-text {
    font-weight: bold;
  }

  #accessOverlay {
    z-index: 10000;
    position: absolute;
    opacity: 0.25;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #000;

    .arrow {
      color: #fff;
      position: fixed;
      left: 50%;
      top: 190px;
      width: 300px;
      margin-left: -250px;

      &.safari {
        margin-left: 250px;
      }
      &.chrome {
        margin-left: -300px;
      }

      .v-icon {
        transform: rotateX(180deg) rotate(270deg);
      }

      div {
        font-size: 18px;
        font-weight: bold;
      }
    }
  }

  .overlay {
    position: relative;

    .v-image {
      opacity: .25;
    }

    .icon-result {
      position: absolute;
      top: 50%;
      bottom: 50%;
      left: 50%;
      right: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      font-weight: bold;
    }
  }
</style>
