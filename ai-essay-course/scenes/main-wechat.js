/* =====================================================================
 * main-wechat.js —— 「企微群发·新建任务」页（组件 wechat-send-page）
 * 还原自真实页面：src/pages/customer-service-management/wechat-group/
 *   add-update.vue（表单骨架、校验、二次确认文案）、components/group-content.vue（内容列表 + 文本话术编辑区）、
 *   components/wechat-preview/index.vue（右侧预览）。DOM / class / 文案取自真实源码；样式见 css/main-wechat.css。
 * 与真实页面的差异（本原型的入口只发"这一位学员"）：
 *   - 群发对象：只读展示，没有「选择群发对象」按钮；群发类型：禁用的下拉（沿用真实页面 taskTypeDisabled 场景的写法）
 *   - 内容添加区只保留「文本话术」一个页签；表情列表取自真实 emoji.json
 *   - 预览里把 [孩子姓名] 替换成学员姓名（真实预览原样显示变量）
 * props：student {sid,name,cls}、content（话术全文，可含 [孩子姓名]）
 * 事件：cancel、submit {content, mode:'now'|'timed', time}
 * ===================================================================== */
(function () {
  function C(opts, tpl) {
    var c = Vue.compile(tpl, { whitespace: 'condense' });
    opts.render = c.render;
    opts.staticRenderFns = c.staticRenderFns;
    return opts;
  }
  var SMILE = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNzA1NDc2ODc0Mzg5IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjQ3MTgiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHBhdGggZD0iTTk1OC4yIDMyNC43Yy0yNC4zLTU3LjUtNTkuMi0xMDkuMi0xMDMuNS0xNTMuNi00NC40LTQ0LjQtOTYtNzkuMi0xNTMuNi0xMDMuNS01OS42LTI1LjItMTIyLjktMzgtMTg4LjEtMzhzLTEyOC41IDEyLjgtMTg4LjEgMzhjLTU3LjUgMjQuMy0xMDkuMiA1OS4yLTE1My42IDEwMy41LTQ0LjQgNDQuNC03OS4yIDk2LTEwMy41IDE1My42LTI1LjIgNTkuNi0zOCAxMjIuOS0zOCAxODguMXMxMi44IDEyOC41IDM4IDE4OC4xYzI0LjMgNTcuNSA1OS4yIDEwOS4yIDEwMy41IDE1My42IDQ0LjQgNDQuNCA5NiA3OS4yIDE1My42IDEwMy41IDU5LjYgMjUuMiAxMjIuOSAzOCAxODguMSAzOHMxMjguNS0xMi44IDE4OC4xLTM4YzU3LjUtMjQuMyAxMDkuMi01OS4yIDE1My42LTEwMy41czc5LjItOTYgMTAzLjUtMTUzLjZjMjUuMi01OS42IDM4LTEyMi45IDM4LTE4OC4xcy0xMi44LTEyOC41LTM4LTE4OC4xek01MTMgOTI0Yy0yMjYuNyAwLTQxMS4yLTE4NC41LTQxMS4yLTQxMS4yUzI4Ni4zIDEwMS42IDUxMyAxMDEuNnM0MTEuMiAxODQuNSA0MTEuMiA0MTEuMlM3MzkuNyA5MjQgNTEzIDkyNHoiIHAtaWQ9IjQ3MTkiIGZpbGw9IiNlMDYyMGQiPjwvcGF0aD48cGF0aCBkPSJNNjk0LjkgNjI0LjJjLTE4LjktNi4yLTM5LjIgNC4xLTQ1LjQgMjMtMTkuMyA1OS4xLTc0LjEgOTguOC0xMzYuNCA5OC44LTU5LjMgMC0xMTMuMi0zNy4yLTEzNC4yLTkyLjctNy0xOC42LTI3LjgtMjgtNDYuNC0yMC45LTE4LjYgNy0yOCAyNy44LTIwLjkgNDYuNCAxNS4zIDQwLjUgNDIuMiA3NS4xIDc3LjcgMTAwLjEgMzYuNCAyNS42IDc5LjIgMzkuMSAxMjMuOCAzOS4xIDQ2LjMgMCA5MC41LTE0LjUgMTI3LjctNDEuOSAzNi40LTI2LjkgNjMuMS02My43IDc3LjEtMTA2LjUgNi4yLTE4LjktNC4xLTM5LjItMjMtNDUuNHpNMzUwIDU1NC4xYzE5LjkgMCAzNi0xNi4xIDM2LTM2VjMzNC40YzAtMTkuOS0xNi4xLTM2LTM2LTM2cy0zNiAxNi4xLTM2IDM2djE4My43YzAgMTkuOSAxNi4xIDM2IDM2IDM2ek02NzQuMSA1NTQuMWMxOS45IDAgMzYtMTYuMSAzNi0zNlYzMzQuNGMwLTE5LjktMTYuMS0zNi0zNi0zNnMtMzYgMTYuMS0zNiAzNnYxODMuN2MwIDE5LjkgMTYuMSAzNiAzNiAzNnoiIHAtaWQ9IjQ3MjAiIGZpbGw9IiNlMDYyMGQiPjwvcGF0aD48L3N2Zz4=';
  var EMOJI = '😀,😁,😂,😃,😄,😅,😆,😉,😊,😋,😎,😍,😘,😗,😙,😚,😇,😐,😑,😶,😏,😣,😥,😮,😯,😪,😫,😴,😌,😛,😜,😝,😒,😓,😔,😕,😲,😷,😖,😞,😟,😤,😢,😭,😦,😧,😨,😬,😰,😱,😳,😵,😡,😠,💘,❤,💓,💔,💕,💖,💗,💙,💚,💛,💜,💝,💞,💟,❣,💪,👈,👉,☝,👆,👇,✌,✋,👌,👍,👎,✊,👊,👋,👏,👐,✍,🍇,🍈,🍉,🍊,🍋,🍌,🍍,🍎,🍏,🍐,🍑,🍒,🍓,🍅,🍆,🌽,🍄,🌰,🍞,🍖,🍗,🍔,🍟,🍕,🍳,🍲,🍱,🍘,🍙,🍚,🍛,🍜,🍝,🍠,🍢,🍣,🍤,🍥,🍡,🍦,🍧,🍨,🍩,🍪,🎂,🍰,🍫,🍬,🍭,🍮,🍯,🍼,☕,🍵,🍶,🍷,🍸,🍹,🍺,🍻,🍴,🌹,🍀,🍎,💰,📱,🌙,🍁,🍂,🍃,🌷,💎,🔪,🔫,🏀,⚽,⚡,👄,👍,🔥,🙈,🙉,🙊,🐵,🐒,🐶,🐕,🐩,🐺,🐱,😺,😸,😹,😻,😼,😽,🙀,😿,😾,🐈,🐯,🐅,🐆,🐴,🐎,🐮,🐂,🐃,🐄,🐷,🐖,🐗,🐽,🐏,🐑,🐐,🐪,🐫,🐘,🐭,🐁,🐀,🐹,🐰,🐇,🐻,🐨,🐼,🐾,🐔,🐓,🐣,🐤,🐥,🐦,🐧,🐸,🐊,🐢,🐍,🐲,🐉,🐳,🐋,🐬,🐟,🐠,🐡,🐙,🐚,🐌,🐛,🐜,🐝,🐞,🦋,😈,👿,👹,👺,💀,☠,👻,👽,👾,💣'.split(',');
  var PARAMS = [
    { label: '孩子姓名', formatter: '[孩子姓名]' },
    { label: '客户昵称(称呼)', formatter: '[客户昵称]' },
    { label: '学习痛点', formatter: '[学习痛点]' },
    { label: '家长需求', formatter: '[家长需求]' }
  ];
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* ---------------- group-content.vue（只保留「文本话术」页签） ---------------- */
  Vue.component('wx-group-content', C({
    props: { contentsData: { type: Array, default: function () { return []; } } },
    data: function () {
      return { smile: SMILE, currentIndex: -1, currentType: '0', currentContent: '', blurIndex: 0,
        isShowEmoji: false, emojiList: EMOJI, paramsList: PARAMS, contents: this.contentsData.slice() };
    },
    watch: {
      contentsData: { handler: function (v) { if (v) this.contents = v.slice(); }, deep: true },
      isShowEmoji: function (v) {
        var me = this;
        this.$nextTick(function () {
          if (v) document.addEventListener('click', me.handleClickOutside);
          else document.removeEventListener('click', me.handleClickOutside);
        });
      }
    },
    beforeDestroy: function () { document.removeEventListener('click', this.handleClickOutside); },
    methods: {
      blur: function (e) { this.blurIndex = e.srcElement.selectionStart; },
      handleClickOutside: function (event) {
        var el = this.$el.querySelector('.emoji');
        if (el && !el.contains(event.target)) this.isShowEmoji = false;
      },
      addParams: function (index) {
        this.currentContent = this.currentContent.slice(0, this.blurIndex) + this.paramsList[index].formatter + this.currentContent.slice(this.blurIndex);
        this.blurIndex = this.currentContent.length;
      },
      toggleEmoji: function (event) { event.stopPropagation(); this.isShowEmoji = !this.isShowEmoji; },
      chooseEmojiDefault: function (e) {
        this.currentContent = this.currentContent.slice(0, this.blurIndex) + e + this.currentContent.slice(this.blurIndex);
        this.isShowEmoji = false; this.blurIndex = this.currentContent.length;
      },
      handleEdit: function (index) {
        this.currentIndex = index;
        this.currentType = this.contents[index].contentType;
        this.currentContent = this.contents[index].content;
      },
      handleDelete: function (index) {
        this.contents.splice(index, 1);
        if (this.currentIndex === index) { this.currentIndex = -1; this.currentType = '0'; this.currentContent = ''; }
        else if (this.currentIndex > index) this.currentIndex--;
        this.contents.forEach(function (item, i) { item.contentSort = i + 1; });
        this.$emit('contentsDataUpdated', this.contents);
      },
      cancel: function () { this.currentIndex = -1; this.currentType = '0'; this.currentContent = ''; },
      resetMess: function () {
        this.currentIndex = -1; this.currentType = '0'; this.currentContent = '';
        this.$emit('contentsDataUpdated', this.contents);
      },
      submitMessage: function () {
        if (this.currentType === '0' && !this.currentContent) return this.$message.error('请输入内容');
        if (this.contents.length > 9 && this.currentIndex === -1) return this.$message.error('已达单次可发消息数量的10条上限！');
        if (this.currentIndex === -1) {
          this.contents = this.contents.concat([{ contentSort: this.contents.length + 1, content: this.currentContent, contentType: this.currentType }]);
        } else {
          this.contents.splice(this.currentIndex, 1, { contentSort: this.currentIndex + 1, content: this.currentContent, contentType: this.currentType });
        }
        this.resetMess();
      }
    }
  },
  '<div class="group-content-container">' +
    '<ul class="content-list">' +
      '<li v-for="(item, key) in contents" :key="\'group-content-item-\' + key" class="content-item">' +
        '<p class="item-sort">{{ 10 > item.contentSort ? \'0\' + item.contentSort : item.contentSort }}</p>' +
        '<p class="item-content" v-html="item.content"></p>' +
        '<div class="item-operation">' +
          '<i class="el-icon-edit item-edit" title="编辑" @click="handleEdit(key)" v-if="item.contentType === \'0\'"></i>' +
          '<i class="el-icon-delete item-delete" title="删除" v-if="!item.locked" @click="handleDelete(key)"></i>' +
        '</div>' +
      '</li>' +
    '</ul>' +
    '<div class="content-edit">' +
      '<el-tabs v-model="currentType">' +
        '<el-tab-pane label="文本话术" name="0">' +
          '<el-input v-model="currentContent" maxlength="1000" placeholder="请输入" show-word-limit rows="10" type="textarea" @blur="blur" ref="inputContent" />' +
          '<div class="operation">' +
            '<img :src="smile" class="emoji-choose" :class="{ active: isShowEmoji }" @click="toggleEmoji" />' +
            '<div class="add-parameter">' +
              '<span>添加变量</span>' +
              '<ul class="param-list">' +
                '<li class="param-item" @click="addParams(index)" v-for="(item, index) in paramsList" :key="\'param-item-\' + index">{{ item.label }}</li>' +
              '</ul>' +
            '</div>' +
            '<div class="emoji" v-show="isShowEmoji">' +
              '<ul class="emoji-default">' +
                '<li v-for="(item, index) in emojiList" :key="index" @click.stop="chooseEmojiDefault(item)">{{ item }}</li>' +
              '</ul>' +
            '</div>' +
          '</div>' +
          '<div class="submit-container">' +
            '<p><i class="el-icon-info" style="margin-right: 5px;"></i>请不要使用黄暴等敏感词</p>' +
            '<div class="button-list">' +
              '<el-button size="medium" type="button" @click="cancel">取消</el-button>' +
              '<el-button size="medium" type="primary" @click="submitMessage">确定</el-button>' +
            '</div>' +
          '</div>' +
        '</el-tab-pane>' +
      '</el-tabs>' +
    '</div>' +
  '</div>'));

  /* ---------------- wechat-preview/index.vue（只保留文本分支 + 占位） ---------------- */
  Vue.component('wx-preview', C({
    props: { contents: { type: Array, default: function () { return []; } } }
  },
  '<div class="wechat-preview-container">' +
    '<div class="wechat-contents-preview">' +
      '<ul class="wechat-list">' +
        '<li v-for="content in contents" :key="content.contentSort" class="wechat-item">' +
          '<span class="preview-text" v-if="content.contentType / 1 === 0" v-html="content.content"></span>' +
        '</li>' +
        '<li v-if="!contents || contents.length === 0" class="wechat-item" key="placeholder">' +
          '<div class="preview-text placeholder-text">' +
            '<p class="preview-file-content">暂无预览内容</p>' +
            '<p class="preview-file-size">请填写网页标题或描述</p>' +
            '<div class="preview-file-icon-box">' +
              '<img class="preview-file-icon" src="https://coolcdn.igetcool.com/p/2024/8/82038d9f81f4f1fd020b1c6cd487afa6.png?_60x60.png" alt="">' +
            '</div>' +
          '</div>' +
        '</li>' +
      '</ul>' +
    '</div>' +
  '</div>'));

  /* ---------------- add-update.vue ---------------- */
  Vue.component('wechat-send-page', C({
    props: { student: { type: Object, default: function () { return { sid: '', name: '', cls: '' }; } }, students: { type: Array, default: function () { return []; } }, taskKind: { type: String, default: 'script' }, content: { type: String, default: '' },
      mode: { type: String, default: '' }, filterText: { type: String, default: '' }, templates: { type: Object, default: function () { return {}; } }, defType: { type: Number, default: 91 } },
    data: function () {
      var me = this;
      var d = new Date();
      var checkContents = function (rule, value, callback) {
        if (me.contents.length === 0) callback(new Error('请确认发送内容')); else callback();
      };
      return {
        taskTypeList: [{ label: 'AI作文课学情话术', value: 90 }, { label: 'AI作文课·自定义群发', value: 91 }, { label: 'AI作文课·催完课', value: 92 }, { label: 'AI作文课·催提交', value: 93 }],
        lastTpl: (this.defType === 92 ? this.templates.done : this.defType === 93 ? this.templates.submit : '') || '',
        contents: this.content ? [{ contentSort: 1, contentType: '0', content: this.content }] : ((this.defType === 92 ? this.templates.done : this.defType === 93 ? this.templates.submit : '') ? [{ contentSort: 1, contentType: '0', content: (this.defType === 92 ? this.templates.done : this.templates.submit) }] : []),
        ruleForm: {
          taskName: (this.taskKind === 'script' ? 'AI作文课话术-' + (this.student.name || '') : ({ 91: 'AI作文课群发', 92: '催完课', 93: '催提交' }[this.defType] || '群发')) + '-' + pad(d.getMonth() + 1) + pad(d.getDate()),
          sendType: '0', sendTime: '', taskType: this.taskKind === 'script' ? 90 : this.defType
        },
        rules: {
          taskName: { required: true, message: '请输入任务名称', trigger: 'change' },
          contents: { required: true, validator: checkContents },
          sendType: { required: true, message: '请选择发送方式', trigger: 'change' }
        }
      };
    },
    computed: {
      list: function () { return this.students.length ? this.students : [this.student]; },
      typeOptions: function () { return this.taskKind === 'script' ? this.taskTypeList.slice(0, 1) : this.taskTypeList.slice(1); },
      targetText: function () {
        var l = this.list, names = l.map(function (x) { return x.name; }).join('、');
        if (this.mode === 'dynamic') return '按当前筛选条件（动态）：' + this.filterText + '；共 ' + l.length + ' 位学员的家长企微好友（已排除家长未加好友 / 已退费学员）';
        if (this.mode === 'static') return '按勾选学员（静态）：共 ' + l.length + ' 位学员的家长企微好友：' + names;
        if (l.length === 1) return '已选择学员 ' + l[0].name + ' 的家长企微好友（1 位）';
        return '已选择 ' + l.length + ' 位学员的家长企微好友：' + names;
      },
      typeTip: function () {
        var l = this.list, t = this.ruleForm.taskType;
        if (t === 92) { var n = l.filter(function (x) { return x.done; }).length; return n ? '提示：其中 ' + n + ' 位本课节已完课，不需要催完课；建议回列表把「是否完课」筛成"否"再发起。' : ''; }
        if (t === 93) {
          var a = l.filter(function (x) { return x.submitted; }).length, b = l.filter(function (x) { return !x.done; }).length, tip = [];
          if (a) tip.push(a + ' 位已提交作文');
          if (b) tip.push(b + ' 位还没完课（应先催完课）');
          return tip.length ? '提示：其中 ' + tip.join('、') + '；建议回列表把「提交状态」筛成"否"再发起。' : '';
        }
        return '';
      },
      /* 预览：变量替换成真实内容（真实页面原样显示变量） */
      previewContents: function () {
        var name = this.list[0].name || '';
        return this.contents.map(function (c) {
          var t = String(c.content == null ? '' : c.content).replace(/\[孩子姓名\]/g, name).replace(/\[客户昵称\]/g, name + '家长');
          return { contentSort: c.contentSort, contentType: c.contentType, content: t };
        });
      }
    },
    methods: {
      onKeyup: function () { return false; },
      /* 切换群发类型：内容为空或还是上一个模板时，换成新类型的默认话术，名称跟着换 */
      onType: function (v) {
        var t = v === 92 ? this.templates.done : v === 93 ? this.templates.submit : '', cur = this.contents.length === 1 && this.contents[0].content === this.lastTpl;
        if (!this.contents.length || cur) this.contents = t ? [{ contentSort: 1, contentType: '0', content: t }] : [];
        this.lastTpl = t || '';
        var d = new Date();
        this.ruleForm.taskName = ({ 91: 'AI作文课群发', 92: '催完课', 93: '催提交' }[v] || '群发') + '-' + pad(d.getMonth() + 1) + pad(d.getDate());
      },
      contentsUpdated: function (data) { this.contents = data.slice(); },
      submitForm: function () {
        var me = this;
        this.$refs.ruleForm.validate(function (valid) {
          if (!valid) return false;
          var f = me.ruleForm;
          if (me.list.length > 500) return me.$message.error('单次群发对象不能超过 500 人，请缩小筛选范围或分批发送');
          if (f.sendType === '1') {
            if (!f.sendTime) return me.$message.error('请选择定时发送时间');
            var diff = new Date(f.sendTime.replace(/-/g, '/')).getTime() - new Date().getTime();
            if (!(diff > 10 * 60 * 1000)) return me.$message.error('定时时间必须距离现在10分钟以上！');
          }
          me.$confirm('是否确认创建企微群发任务', '请确认创建群发', {
            confirmButtonText: '确定', cancelButtonText: '我再想想', type: 'warning'
          }).then(function () {
            me.$emit('submit', {
              content: me.contents.map(function (c) { return c.content; }).join('\n'),
              taskKind: ({ 90: 'script', 91: 'free', 92: 'done', 93: 'submit' })[f.taskType],
              mode: f.sendType === '1' ? 'timed' : 'now',
              time: f.sendType === '1' ? f.sendTime : ''
            });
          }).catch(function () {});
        });
      },
      cancel: function () { this.$refs.ruleForm.resetFields(); this.$emit('cancel'); }
    }
  },
  '<div class="handle-header-wechat handle-item">' +
    '<div class="form-box">' +
      '<div class="handle-tag"></div>' +
      '<div class="handle-title">新建群发</div>' +
      '<div class="layout">' +
        '<el-form @submit.native.prevent size="large" :model="ruleForm" :rules="rules" ref="ruleForm" label-width="100px">' +
          '<el-form-item label="任务名称" prop="taskName">' +
            '<el-input v-model="ruleForm.taskName" placeholder="请给这次群发起个名字~" show-word-limit maxlength="20" @keyup.native="onKeyup"></el-input>' +
          '</el-form-item>' +
          '<el-form-item label="群发类型" prop="taskType">' +
            '<el-select :disabled="taskKind === \'script\'" v-model="ruleForm.taskType" placeholder="请选择群发类型" style="width: 100%;" @change="onType">' +
              '<el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>' +
            '</el-select>' +
          '</el-form-item>' +
          '<el-form-item label="群发对象" prop="groupMembers">' +
            '<span>{{ targetText }}</span><p v-if="typeTip" class="time-tips" style="color: #e6a23c;">{{ typeTip }}</p>' +
          '</el-form-item>' +
          '<el-form-item label="群发内容" prop="contents" size="large" class="custom-label">' +
            '<wx-group-content ref="groupContent" :contentsData="contents" @contentsDataUpdated="contentsUpdated"></wx-group-content>' +
          '</el-form-item>' +
          '<el-form-item label="群发时间" prop="sendType" class="time-item">' +
            '<el-radio-group v-model="ruleForm.sendType">' +
              '<el-radio label="0">立即发送</el-radio>' +
              '<el-radio label="1">定时发送</el-radio>' +
            '</el-radio-group>' +
            '<el-date-picker clearable v-if="ruleForm.sendType === \'1\'" v-model="ruleForm.sendTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss" placeholder="选择日期时间"></el-date-picker>' +
            '<p class="time-tips">注意: 选择立即发送方式时, 可能会有短暂的延时<br>选择定时发送时, 发送时间最早要设置在10分钟后</p>' +
          '</el-form-item>' +
          '<el-form-item>' +
            '<el-button size="medium" type="button" @click="submitForm">提交</el-button>' +
            '<el-button size="medium" type="button" @click="cancel">取消</el-button>' +
          '</el-form-item>' +
        '</el-form>' +
        '<wx-preview :contents="previewContents"></wx-preview>' +
      '</div>' +
    '</div>' +
  '</div>'));
})();
