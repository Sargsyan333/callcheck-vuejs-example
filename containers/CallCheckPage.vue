<template>
  <v-container grid-list-md>
    <v-layout row justify-center>
      <v-flex>
        <v-card>
          <v-card-text>
            <v-layout column class="mb-4">
              <h1 class="heading">
                {{ $t('callcheck.title') }}
              </h1>
              <h4 class="subheading text-xs-center">
                {{ $t('callcheck.subtitle') }}
              </h4>
            </v-layout>

            <StartIcon :items="checkItems" :step="step" :loading="loading" :starting="starting"/>

            <v-layout row justify-center class="mb-2">
              <h4 class="subheading text-xs-center" v-if="!loading && !stop">
                {{ $t('callcheck.descr') }}
              </h4>

              <transition name="slide-y-transition">
                <v-flex v-if="loading" class="xs4 progress-bar">
                  <div class="percents secondary--text" :style="{'margin-left': `calc(${value}% - 10px)`, 'right': value >= 95 ? 0 : 'inherit'}">{{value}}%</div>
                  <v-progress-linear height="7" :value="value" color="secondary"></v-progress-linear>
                </v-flex>
              </transition>

            </v-layout>

            <v-layout row justify-center>
              <v-btn
                round
                color="accent"
                class="elevation-0 text-capitalize"
                @click="startOTT"
                :disabled="loading"
                v-if="step <= 1 || !stop"
              >
                {{ $t('callcheck.btn.start') }}
              </v-btn>

              <v-btn
                round
                color="secondary"
                class="elevation-0 text-capitalize"
                @click="stopTest"
                v-if="step >= 1 && stop"
              >
                {{ $t('callcheck.btn.stop') }}
              </v-btn>
            </v-layout>

            <v-layout row justify-center v-if="article && slug">
              <v-flex v-html="article(slug.toLowerCase()).content"></v-flex>
            </v-layout>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
    <transition name="slide-x-reverse-transition">
      <div class="layout row" v-if="step >= 1 && checkItems[0].error">
        <v-flex xs12>
          <CheckBrowser :data="checkItems[0]"/>
        </v-flex>
      </div>
    </transition>
    <transition name="slide-x-reverse-transition">
      <div class="layout row" v-if="step >= 2">
        <v-flex xs12>
          <CheckCamera :data="checkItems[1]" :browser="checkItems[0].data.browserName"/>
        </v-flex>
      </div>
    </transition>
    <transition name="slide-x-reverse-transition">
      <div class="layout row" v-if="step >= 3">
        <v-flex xs12>
          <CheckMicrophone :data.sync="checkItems[2]" :browser="checkItems[0].data.browserName"/>
        </v-flex>
      </div>
    </transition>
    <transition name="slide-x-reverse-transition">
      <div class="layout row" v-if="step >= 4">
        <v-flex xs12>
          <CheckAudio :data.sync="checkItems[3]" :results="callcheckResults"/>
        </v-flex>
      </div>
    </transition>
  </v-container>

</template>

<script>
  import { mapGetters, mapActions, mapMutations } from 'vuex';
  // import OT from '@opentok/client';
  // import NetworkTest, { ErrorNames } from 'opentok-network-test-js';
  import { ErrorNames } from 'opentok-network-test-js';
  import { detect } from 'detect-browser';

  import OTPrecall from '@/shared/utils/precall';

  import StartIcon from '../components/StartCheck';
  import CheckBrowser from '../components/CheckBrowser';
  import CheckCamera from '../components/CheckCamera';
  import CheckMicrophone from '../components/CheckMicrophone';
  import CheckAudio from '../components/CheckAudio';

  /**
   * @Todo
   * 1. Handle all errors (API)
   * 2. Articles
   * 3. Audio Check
   */
  export default {
    name: 'CallCheckPage',
    components: {
      StartIcon,
      CheckBrowser,
      CheckCamera,
      CheckMicrophone,
      CheckAudio,
    },
    data() {
      return {
        value: 0,
        progressUpdater: {},
        stopBtnTimer: {},
        step: 0,
        checkItems: [
          { src: '/static/icons/svg/browser.svg' },
          { src: '/static/icons/svg/webcam.svg', data: {} },
          { src: '/static/icons/svg/microphone.svg', data: {} },
          { src: '/static/icons/svg/headphones.svg', data: {} },
        ],
        loading: false,
        starting: false,
        stop: false,
        callcheckResults: {
          success: false,
          mos_audio: null,
          mos_video: null,
          packet_loss_ratio_audio: null,
          packet_loss_ratio_vsideo: null,
          download_speed: null,
          meta: {},
        },
        slug: '',
        video: null,
        precall: new OTPrecall(),
      };
    },
    computed: {
      ...mapGetters('global/user', {
        logged: 'isLoggedIn',
      }),
      ...mapGetters('global/articles', {
        article: 'getArticle',
      }),
      ...mapGetters('callcheck', {
        credentials: 'getTokboxCredentials',
      }),
    },
    methods: {
      ...mapActions('callcheck', [
        'fetchTokboxCredentials',
        'postCallcheck',
        'resetTests',
      ]),
      ...mapMutations('callcheck', [
        'setTestResults',
      ]),

      startOTT() {
        this.reset();
        try {
          this.loading = true;
          this.starting = true;
          /* Clean timer before start */
          clearInterval(this.progressUpdater);

          this.$nextTick(() => {
            /**
             * Fetch Credentials from API Server.
             */
            this.fetchTokboxCredentials().then(() => {
              this.precall.checkBrowser();
            });
            this.precall
            /**
             * Browser Hardware Checked
             * @callback {object}
             * @param {string} browserName
             * @param {boolean} isSupported
             * @param {?boolean} otPluginInstalled - Returns for IE 6+
             */
              .on('browserChecked', (result) => {
                this.step = 1;

                this.checkItems[0].data = result;

                const browser = detect();
                let version = browser.version.split('.');
                if (version && version[0]) {
                  version = parseInt(version[0], 10);
                }

                if (result.isSupported && (browser.name !== 'ie')) {
                  this.precall.testConnectivity(this.credentials);
                  this.precall.checkCamera();
                  this.precall.checkMicrophone();

                  /* Show Stop Button after 5sec <- !!!Important!!! */
                  this.stopBtnTimer = setTimeout(() => {
                    this.stop = true;
                  }, 5000);
                } else {
                  // Otherwise Show Browser Box
                  this.handleError({ name: 'UNSUPPORTED_BROWSER' });
                }
              })
              /**
               * Camera Hardware Test
               * @callback {object}
               * @param {string} testType = 'video'
               * @param {boolean} hasDevice
               * @param {(array|object[])} deviceList
               */
              .on('cameraChecked', (result) => {
                // Camera
                this.step = 2;
                this.checkItems[1].data = result;
                console.log('cameraChecked', result); //eslint-disable-line
              })
              /**
               * Microphone Hardware Test
               * @callback {object}
               * @param {string} testType = 'audio'
               * @param {boolean} hasDevice
               * @param {(array|object[])} deviceList
               */
              .on('microphoneChecked', (result) => {
                // Microphone
                this.step = 3;
                this.checkItems[2].data = result;
                console.log('microphoneChecked', result); //eslint-disable-line
              })
              /**
               * OT Connectivity Test
               * @callback {object}
               * @param {boolean} success
               * @param {(array|object[])} failedTests
               */
              .on('connectivityTestCompleted', (result) => {
                if (result.failedTests.length > 0) {
                  result.failedTests.forEach((failedTest) => {
                    this.handleError(failedTest.error.name);
                  });
                } else if (result.success) {
                  this.precall.testQuality();
                }
                console.log('connectivityTestCompleted', result); //eslint-disable-line
              })
              /**
               * OT Quality Test Started
               * @callback {object}
               * @param {number} timeout
               */
              .on('qosTestStarted', (result) => {
                this.starting = false;

                const updateIntervalMs = 1000;
                const secondsTotal = Math.ceil(result.timeout / 1000);
                let secondsElapsed = 0;

                this.progressUpdater = setInterval(() => {
                  if (secondsElapsed > secondsTotal) {
                    return clearInterval(this.progressUpdater);
                  }
                  this.value = Math.floor(secondsElapsed++ / secondsTotal * 100); //eslint-disable-line
                  return null;
                }, updateIntervalMs);

                console.log('qosTestStarted', result); //eslint-disable-line
              })
              /**
               * OT Quality Test Completed
               * @callback {object}
               * @param {object} audio - Returning Bitrate, MOS, Ratio
               * @param {object} video - Returning Bitrate, MOS, Ratio, Recommendation (Frame Rate, Resolution)
               */
              .on('qosTestCompleted', (result) => {
                this.step = 4;
                this.loading = false;
                this.stop = false;

                /* Sending results to Vuex */
                this.setTestResults(result);

                console.log('qosTestCompleted', result); //eslint-disable-line

                /* Set info into Vuex? */
                this.callcheckResults = {
                  ...this.callcheckResults,
                  success: result.audio.supported && result.video.supported,
                  mos_audio: result.audio.mos,
                  mos_video: result.video.mos,
                  packet_loss_ratio_audio: result.audio.packetLossRatio,
                  packet_loss_ratio_video: result.video.packetLossRatio,
                };

                /* Send 'firstCheck' tests to server */
                if (this.logged) {
                  this.postCallcheck(this.callcheckResults)
                    .catch(e => this.notifyError(e));
                }
              })
              /**
               * Error Handle
               * @callback {object}
               */
              .on('handleError', (error) => {
                console.error('Error', error); //eslint-disable-line
                this.handleError(error.name ? error.name : error);
              });
          });
        } catch (e) {
          console.error(e); //eslint-disable-line
          this.handleError(e);
          this.loading = false;
        }
      },
      /* Deprecated */
      checkQuality() {
        this.otNetworkTest.testQuality((res) => {
          console.log(res); //eslint-disable-line
        }).then((results) => {
          console.log(results); //eslint-disable-line
          /* Microphone && Sound */
          if (results.audio.supported) {
            this.checkItems[2] = { ...this.checkItems[2], isSuccess: true, checked: true };
            this.checkItems[3] = { ...this.checkItems[3], isSuccess: true, checked: true };
          }
          /* Video Cam */
          if (results.video.supported) {
            this.checkItems[1] = { ...this.checkItems[3], isSuccess: true, checked: true };
          }

          this.callcheckResults = {
            ...this.callcheckResults,
            success: results.audio.supported && results.video.supported,
            mos_audio: results.audio.mos,
            mos_video: results.video.mos,
            packet_loss_ratio_audio: results.audio.packetLossRatio,
            packet_loss_ratio_video: results.video.packetLossRatio,
          };

          if (this.logged) {
            this.postCallcheck(this.callcheckResults)
              .catch(e => this.notifyError(e));
          }
        }).then(() => {
          this.loading = false;
        }).catch((e) => {
          this.handleError(e.name ? e.name : e);
          return false;
        });
      },
      handleError(name) {
        console.log(name); //eslint-disable-line
        this.loading = false;
        clearTimeout(this.stopBtnTimer);
        /*
          API_CONNECTIVITY_ERROR: "APIConnectivityError"
          CONNECTIVITY_ERROR: "ConnectivityError"
          CONNECT_TO_SESSION_ERROR: "ConnectToSessionError"
          CONNECT_TO_SESSION_ID_ERROR: "ConnectToSessionSessionIdError"
          CONNECT_TO_SESSION_NETWORK_ERROR: "ConnectToSessionNetworkError"
          CONNECT_TO_SESSION_TOKEN_ERROR: "ConnectToSessionTokenError"
          FAILED_MESSAGING_SERVER_TEST: "FailedMessagingServerTestError"
          FAILED_TO_CREATE_LOCAL_PUBLISHER: "FailedToCreateLocalPublisher"
          FAILED_TO_OBTAIN_MEDIA_DEVICES: "FailedToObtainMediaDevices"
          INCOMPLETE_SESSON_CREDENTIALS: "IncompleteSessionCredentialsError"
          INIT_PUBLISHER_ERROR: "InitPublisherError"
          INVALID_ON_UPDATE_CALLBACK: "InvalidOnUpdateCallback"
          LOGGING_SERVER_CONNECTION_ERROR: "LoggingServerConnectionError"
          MEDIA_DEVICE_ERROR: "MediaDeviceError"
          MISSING_OPENTOK_INSTANCE: "MissingOpenTokInstanceError"
          MISSING_SESSON_CREDENTIALS: "MissingSessionCredentialsError"
          MISSING_SUBSCRIBER_ERROR: "MissingSubscriberError"
          NETWORK_TEST_ERROR: "NetworkTestError"
          NO_AUDIO_CAPTURE_DEVICES: "NoAudioCaptureDevicesError"
          NO_VIDEO_CAPTURE_DEVICES: "NoVideoCaptureDevicesError"
          PUBLISH_TO_SESSION_ERROR: "PublishToSessionError"
          PUBLISH_TO_SESSION_NETWORK_ERROR: "PublishToSessionNetworkError"
          PUBLISH_TO_SESSION_NOT_CONNECTED: "PublishToSessionNotConnectedError"
          PUBLISH_TO_SESSION_PERMISSION_OR_TIMEOUT_ERROR: "PublishToSessionPermissionOrTimeoutError"
          QUALITY_TEST_ERROR: "QualityTestError"
          SUBSCRIBER_GET_STATS_ERROR: "SubscriberGetStatsError"
          SUBSCRIBE_TO_SESSION_ERROR: "SubscribeToSessionError"
          UNSUPPORTED_BROWSER: "UnsupportedBrowser"
        */

        /* Switch for using Articles Module */
        switch (name.name ? name.name : name) {
          // No openTok lib
          case ErrorNames.MISSING_OPENTOK_INSTANCE:
            this.notifyError(this.$t(`callcheck.error.${name}`));

            // Browser Error
            this.checkItems[0] = {
              ...this.checkItems[0],
              error: 'MISSING_OPENTOK_INSTANCE',
              error_text: this.$t(`callcheck.error.${name}`),
            };
            console.error('Missing OT instance in constructor.');
            break;

          // Error with openTok credentials (api, token, uid)
          case ErrorNames.INCOMPLETE_SESSON_CREDENTIALS:
          case ErrorNames.MISSING_SESSON_CREDENTIALS:
          case ErrorNames.INVALID_SESSON_CREDENTIALS:
            this.notifyError(this.$t('callcheck.error.SessionCredentialsError'));

            // API Error!!!
            this.checkItems[0] = {
              ...this.checkItems[0],
              error: 'INCOMPLETE_SESSON_CREDENTIALS',
              error_text: this.$t('callcheck.error.SessionCredentialsError'),
            };
            break;

          case 'UNSUPPORTED_BROWSER':
          case ErrorNames.UNSUPPORTED_BROWSER:
            this.notifyError(this.$t(`callcheck.error.${name}`));

            this.checkItems[0] = {
              ...this.checkItems[0],
              error: 'UNSUPPORTED_BROWSER',
              error_text: this.$t(`callcheck.error.${name}`),
            };

            console.error('The test is running on an unsupported browser.');
            break;

          // case ErrorNames.LOGGING_SERVER_CONNECTION_ERROR: // ???
          // case ErrorNames.FAILED_MESSAGING_SERVER_TEST: // ???
          case ErrorNames.CONNECT_TO_SESSION_NETWORK_ERROR:
            this.notifyError(this.$t(`callcheck.error.${name}`));

            // Browser Error
            this.checkItems[0] = {
              ...this.checkItems[0],
              error: 'CONNECT_TO_SESSION_NETWORK_ERROR',
              error_text: this.$t(`callcheck.error.${name}`),
            };
            break;

          case ErrorNames.FAILED_TO_OBTAIN_MEDIA_DEVICES:
            this.notifyError(this.$t(`callcheck.error.${name}`));

            // Devices Error
            this.checkItems[1] = {
              ...this.checkItems[1],
              error: 'FAILED_TO_OBTAIN_MEDIA_DEVICES',
              error_text: this.$t(`callcheck.error.${name}`),
            };
            this.checkItems[2] = {
              ...this.checkItems[2],
              error: 'FAILED_TO_OBTAIN_MEDIA_DEVICES',
              error_text: this.$t(`callcheck.error.${name}`),
            };
            break;

          case ErrorNames.FAILED_TO_CREATE_LOCAL_PUBLISHER:
            this.notifyError(this.$t(`callcheck.error.${name}`));

            // Browser Error
            this.checkItems[0] = {
              ...this.checkItems[0],
              error: 'FAILED_TO_CREATE_LOCAL_PUBLISHER',
              error_text: this.$t(`callcheck.error.${name}`),
            };
            this.checkItems[1] = {
              ...this.checkItems[1],
              error: 'FAILED_TO_CREATE_LOCAL_PUBLISHER',
              error_text: this.$t(`callcheck.error.${name}`),
            };
            this.checkItems[2] = {
              ...this.checkItems[2],
              error: 'FAILED_TO_CREATE_LOCAL_PUBLISHER',
              error_text: this.$t(`callcheck.error.${name}`),
            };
            break;

          case ErrorNames.NO_AUDIO_CAPTURE_DEVICES:
            this.notifyError(this.$t(`callcheck.error.${name}`));

            // Audio Error
            this.checkItems[2] = {
              ...this.checkItems[2],
              error: 'NO_AUDIO_CAPTURE_DEVICES',
              error_text: this.$t(`callcheck.error.${name}`),
            };
            break;

          case ErrorNames.NO_VIDEO_CAPTURE_DEVICES:
            this.notifyError(this.$t(`callcheck.error.${name}`));

            // Video Error
            this.checkItems[1] = {
              ...this.checkItems[1],
              error: 'NO_VIDEO_CAPTURE_DEVICES',
              error_text: this.$t(`callcheck.error.${name}`),
            };
            break;

          default:
            this.notifyError(name);
            console.error(name);
            // this.stopTest();
            break;
        }
      },

      /* Not working? */
      /* Stops after 5sec */
      stopTest() {
        try {
          /* Reset all params to init */
          this.reset();
          this.precall.destroy();
        } catch (e) {
          this.handleError(e);
        }
      },
      reset() {
        /* Reset Vuex */
        this.resetTests();
        this.step = 0;
        this.value = 0;
        this.loading = false;
        this.starting = false;
        this.stop = false;
      },
      /*
        OpenTok check bandwidth for connection
        https://support.tokbox.com/hc/en-us/articles/200959390-What-is-the-minimum-bandwidth-requirement-to-use-OpenTok-
      */
      checkSpeed() {
        const image = 'http://www.kenrockwell.com/contax/images/g2/examples/31120037-5mb.jpg';
        const downloadSize = 4995374; // bytes
        // const image = '/static/images/speedtest.jpeg';
        // const downloadSize = 9281; // bytes

        let startTime;
        let endTime;
        const download = new Image();

        download.onload = () => {
          endTime = (new Date()).getTime();

          const duration = (endTime - startTime) / 1000;
          const bitsLoaded = downloadSize * 8;
          const speedBps = (bitsLoaded / duration).toFixed(2);
          const speedKbps = (speedBps / 1024).toFixed(2);
          this.callcheckResults.download_speed = +(speedKbps / 1024).toFixed(2);
        };

        download.onerror = (err, msg) => {
          this.handleError(msg); //eslint-disable-line
        };

        startTime = (new Date()).getTime();
        const cacheBuster = '?nnn=' + startTime;  //eslint-disable-line
        download.src = image + cacheBuster;
      },
    },
    mounted() {
    },
  };
</script>

<style lang="scss" scoped>
  .progress-bar {
    position: relative;

    .percents {
      transition: all .25s ease-in-out;
      position: absolute;
      top: -10px;
    }
  }

  .vv-call-check-page {
    background: #f3f3f3;
    padding: 30px 0;
  }

  .call-check-main {
    display: flex;
    justify-content: space-between;
    background-color: #fff;
    padding: 20px;
    .call-check-tabs {
      width: 33%;
      margin-bottom: auto;
      .item-to-check {
        position: relative;
        cursor: pointer;
        padding: 20px;
        border-bottom: 1px solid #e5e5e5;
        &.active {
          background-color: #F8F5F0;
        }
        .is-success {
          position: absolute;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
        }
      }
    }
    .call-check-content {
      width: 66%;
      padding: 0 20px;
    }
  }
</style>
