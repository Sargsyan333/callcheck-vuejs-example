<template>
  <v-card>
    <v-card-text>
      <v-layout row align-center>
        <v-flex xs3 :class="{'overlay': isAudioPlay || isAudioChecked}">
          <v-img
            :src="data.src"
            height="120px"
            contain
          ></v-img>
          <v-icon
            color="secondary"
            class="icon-result pulse"
            size="76"
            v-if="isAudioPlay"
          >play_arrow</v-icon>

          <v-icon
            color="secondary"
            class="icon-result"
            large
            v-if="!isAudioPlay && results.success && isAudioChecked"
          >check_circle</v-icon>
          <v-icon
            color="error"
            class="icon-result"
            large
            v-if="!isAudioPlay && !results.success && isAudioChecked"
          >cancel</v-icon>
        </v-flex>
        <v-flex xs3>
          <h4 class="title">{{ $t('callcheck.audio.heading') }}</h4>
          <p class="mt-2" v-if="!isAudioPlay && !data.error">
            {{ $t('callcheck.audio.descr') }}
          </p>
          <p class="mt-2" v-else>
            {{ data.error_text }}
          </p>
        </v-flex>
        <v-flex xs3 class="text-xs-center">
          <v-btn
            round
            color="secondary"
            class="elevation-0 text-capitalize"
            @click="playSound()" v-if="!isAudioPlay"
          >
            {{ $t('callcheck.audio.btn.play') }}
            <v-icon light small>play_arrow</v-icon>
          </v-btn>
          <v-btn
            round
            outline
            color="secondary"
            class="elevation-0 text-capitalize"
            @click="success()" v-if="isAudioPlay"
          >
            {{ $t('callcheck.audio.btn.yes') }}
          </v-btn>
        </v-flex>
        <v-flex xs3>
          <ArticleDialog v-if="isAudioChecked || isAudioPlay" :content-key="'CALLCHECK_NOT_HEAR'" :btn="$t('callcheck.audio.btn.label')" v-on:click="stopSound()"/>

        </v-flex>
      </v-layout>
    </v-card-text>
  </v-card>

</template>

<script>
  import { mapGetters, mapActions } from 'vuex';
  // import VvBaseButton from '@/shared/components/BaseButton';
  // import VvArrowIcon from '@/shared/components/ArrowIcon';
  import ArticleDialog from './DialogWithArticle';

  export default {
    components: {
      ArticleDialog,
    },
    props: ['data', 'results'],
    data() {
      return {
        audioUrl: 'https://s3.eu-central-1.amazonaws.com/volunteervision-prod/v1/file/1476792028_lf3ba4a.mp3',
        audio: null,
        isAudioPlay: false,
        isAudioChecked: false,
        isCheckDone: false,
      };
    },
    computed: {
      ...mapGetters('global/user', {
        logged: 'isLoggedIn',
      }),
    },
    methods: {
      ...mapActions('callcheck', [
        'postCallcheck',
      ]),
      playSound() {
        this.audio = new Audio(this.audioUrl);
        this.audio.play();
        this.isAudioPlay = true;
      },
      success() {
        this.audio.pause();
        this.isAudioPlay = false;
        this.isAudioChecked = true;
        this.results.audio_output = true;

        /* Send final tests to server */
        if (this.logged) {
          this.postCallcheck(this.results)
            .then(() => this.notifySuccess(this.$t('callcheck.success')))
            .catch(e => this.notifyError(e));
        } else {
          this.notifySuccess(this.$t('callcheck.success'));
        }
      },
      stopSound() {
        this.audio.pause();
        this.isAudioChecked = true;
        this.isAudioPlay = false;
        this.results.success = false;
        this.results.audio_output = false;

        /* Send final tests to server */
        // this.postCallcheck(this.results)
        //   .catch(e => this.notifyError(e));
      },
    },
    mounted() {
      window.scrollTo(0, document.body.scrollHeight);
    },
  };
</script>
<style lang="scss" scoped>
  @import '~@/styles/index';

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

    .pulse {
      width: 120px;
      height: 120px;
      border: 3px solid $secondary;
      border-radius: 50%;
      box-shadow: 0 0 0 lighten($secondary, 0.4);
      animation: pulse 2s infinite;
    }
  }

  @-webkit-keyframes pulse {
    0% {
      -webkit-box-shadow: 0 0 0 0 $secondary;
    }
    70% {
        -webkit-box-shadow: 0 0 0 10px rgba(204,169,44, 0);
    }
    100% {
        -webkit-box-shadow: 0 0 0 0 rgba(204,169,44, 0);
    }
  }
  @keyframes pulse {
    0% {
      -moz-box-shadow: 0 0 0 0 $secondary;
      box-shadow: 0 0 0 0 $secondary;
    }
    70% {
        -moz-box-shadow: 0 0 0 10px rgba(204,169,44, 0);
        box-shadow: 0 0 0 10px rgba(204,169,44, 0);
    }
    100% {
        -moz-box-shadow: 0 0 0 0 rgba(204,169,44, 0);
        box-shadow: 0 0 0 0 rgba(204,169,44, 0);
    }
  }
</style>

