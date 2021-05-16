export default {
  methods: {
    handleError(error) {
      if (typeof error === 'string') {
        // Got an API-defined error. Show it to the user in a Message
        this.$message.error(error);
      } else {
        // Got an unexpected error. Print it to the console and show a generic
        // error message to the user.
        console.error(error);
        const messageElement = this.$createElement('p',
          { class: 'el-message__content' },
          [
            `Oh dear, something didn't exactly work like I intended it to.
            Could you `,
            this.$createElement('el-link',
              {
                props: {
                  type: 'primary',
                  href: 'https://github.com/Procrat/eva-web/issues/new',
                },
                attrs: {
                  style: 'vertical-align: inherit',
                  target: '_blank',
                },
              },
              'let my developer know'),
            ' that something went wrong? Tell him that you got this error:',
            this.$createElement('p',
              {
                attrs: {
                  style: 'padding-left: 20px',
                },
              },
              [
                this.$createElement('code', error.toString()),
              ]),
            "He might know what's up. Thanks!",
          ]);
        this.$message({
          message: messageElement,
          type: 'error',
          duration: 0, // Don't turn off
          showClose: true,
        });
      }
    },
  },
};
