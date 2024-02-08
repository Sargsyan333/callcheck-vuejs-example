<template>
  <div class="call-check-content-wrapper">
    <iframe frameborder="0" height="300" width="100%" src="https://fast.com/de/"></iframe>
    <v-alert :value="true" type="info" outline>
      {{ $t('callcheck.speedcheck.internet.connection') }} <a href="http://speedtest.t-online.de" style="color:black">Telekom Speedtest</a>
    </v-alert>

    <div class="btn-wrapper single">
      <vv-base-button color="accent" @click="checkSystem">
        {{ $t('common.labels.done') }}
      </vv-base-button>
    </div>
  </div>
</template>

<script>
  import VvBaseButton from '@/shared/components/BaseButton';
  import { mapActions } from 'vuex';

  export default {
    components: {
      VvBaseButton,
    },
    props: {
      isSpeed: {
        type: Boolean,
      },
      otNetworkTest: Object,
      callcheckResults: Object,
    },
    methods: {
      ...mapActions('callcheck', [
        'postCallcheck',
      ]),
      checkSystem() {
        this.$emit('update:isSpeed', true);
        this.postCallcheck(this.callcheckResults);
      },
    },
  };
</script>
