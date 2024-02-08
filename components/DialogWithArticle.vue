<template>
  <div class="text-xs-center" @click="$emit('click')">
    <v-btn
      @click="openDialog()"
      round
      color="secondary"
      class="elevation-0 text-capitalize"
      dark
    >
      {{ btn }}
    </v-btn>
    <v-dialog v-model="dialog" width="500" v-if="getArticle(this.contentKey)">
      Dialog:
      <v-card>
        <v-card-title class="headline">
          {{ getArticle(this.contentKey).title }}
        </v-card-title>
        <v-card-text v-html="getArticle(this.contentKey).content"></v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
  import { mapGetters } from 'vuex';

  export default {
    name: 'ArticleDialog',
    props: ['contentKey', 'btn'],
    data() {
      return {
        dialog: false,
      };
    },
    computed: {
      ...mapGetters('global/articles', {
        getArticle: 'getArticle',
      }),
    },
    methods: {
      async openDialog() {
        if (!this.contentKey) {
          this.notifyError({ message: 'Missing Content Key:' });
          return;
        }
        this.contentKey = this.contentKey.toLowerCase();
        try {
          await this.$store.dispatch('global/articles/fetchArticleByKey', { key: this.contentKey });
          this.dialog = true;
        } catch (e) {
          console.error(e);
          this.notifyError(e);
        }
      },
    },
  };
</script>
<style lang="scss" scoped>
</style>
