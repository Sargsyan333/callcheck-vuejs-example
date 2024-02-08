<template>
  <!-- <div class="call-check-content-wrapper">
    <v-alert :value="true" type="error" outline class="top" v-if="!checkBrowser()">
      {{ $t('callcheck.browser.not.compatible') }}
    </v-alert>

    <v-alert :value="true" type="success" outline class="top" v-else>
      {{ $t('callcheck.congratulations') }} ! <br>
      {{ $t('callcheck.browser.compatible') }}
    </v-alert>

    <div class="btn-wrapper single">
      <vv-base-button color="accent" @click="$emit('update:step', 2)">
        {{ $t('common.labels.next') }}
        <vv-arrow-icon class="btn-icon" target="right" color="white" />
      </vv-base-button>
    </div>
  </div> -->
  <v-card>
    <v-card-text>
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
            v-if="data.data.isSupported && !data.error"
            large
          >check_circle</v-icon>
          <v-icon
            color="error"
            class="icon-result"
            v-else
            large
          >cancel</v-icon>
        </v-flex>
        <v-flex xs6>
          <h4 class="title">{{ $t('callcheck.browser.heading') }}</h4>
          <p class="mt-2" v-if="data.data.isSupported && !data.error">
            {{data.data.browserName}} {{ $t('callcheck.browser.compatible') }}
          </p>
          <p class="mt-2" v-else>
            {{ data.error_text }}
          </p>
        </v-flex>
        <v-flex xs3>
          <ArticleDialog v-if="data.error" :content-key="'CALLCHECK_'+data.error" :btn="$t('callcheck.browser.btn.label')"/>
          <!-- <v-btn
            @click="openDialog()"
            round
            color="secondary"
            class="elevation-0 text-capitalize"
            dark
          >
            {{ $t('callcheck.browser.btn.label') }}
          </v-btn>
          <v-dialog v-model="dialog" width="500" v-if="getArticle(this.data.error)">
            <v-card>
              <v-card-title class="headline">
                {{ getArticle(this.data.error).title }}
              </v-card-title>
              <v-card-text v-html="getArticle(this.data.error).content"></v-card-text>
            </v-card>
          </v-dialog> -->
        </v-flex>
      </v-layout>
    </v-card-text>
  </v-card>
</template>

<script>
import ArticleDialog from './DialogWithArticle';

export default {
  name: 'CheckBrowser',
  props: ['data'],
  components: {
    ArticleDialog,
  },
  data() {
    return {
    };
  },
};
</script>
<style lang="scss" scoped>
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
