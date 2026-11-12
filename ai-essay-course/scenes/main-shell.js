/* =====================================================================
 * main-shell.js —— 班课主系统外壳：app-shell（顶栏 / 侧栏 / 面包屑 / 内容区）
 * DOM 与 class 逐字取自 /tmp/demo-spec/shell/{dom-header,dom-menu,dom-layout}.html 与
 *   /tmp/demo-spec/bell/{dom-bell-icon,dom-popover,dom-dialog,dom-cards}.html，
 * 使用真实 el-menu / el-submenu / el-breadcrumb / el-badge / el-popover / el-dropdown / el-tabs / el-dialog。
 * 样式见 css/main-shell.css（逐字取自 style-layout.css、style-notice.css）。
 *
 * 模板用 Vue.compile(..., {whitespace:'condense'}) 编译，与真实项目 vue-loader 的空白处理一致
 * （否则 .normal-notice 与铃铛之间会多出一个空格，铃铛右移约 5px，见 bell/notes.md 第 2 节）。
 * ===================================================================== */
(function () {
  var IMG = 'assets/src/img/';

  function C(opts, tpl) {
    var c = Vue.compile(tpl, { whitespace: 'condense' });
    opts.render = c.render;
    opts.staticRenderFns = c.staticRenderFns;
    return opts;
  }

  /* ------------------------------------------------------------------
   * shell-header：Header.vue（顶栏）
   * ------------------------------------------------------------------ */
  Vue.component('shell-header', C({
    props: ['isCollapse'],
    data: function () { return { bellShow: false, bellTab: 'all', readStatus: 'unread' }; },
    computed: {
      /* 作文求助通知：只给该学员所属班级的教辅（= 当前登录教辅）推送 */
      helps: function () { var me = (this.ctx.S || {}).me; return ((this.ctx.S || {}).helps || []).filter(function (h) { return h.t === me; }); },
      unread: function () { return this.helps.filter(function (h) { return !h.read; }).length; },
      shown: function () {
        var st = this.readStatus;
        if (this.bellTab === 'follow') return [];
        return this.helps.filter(function (h) { return st === 'all' || !h.read; });
      }
    },
    methods: {
      todo: function () { this.$act('fake', { m: '待办面板是班课现有功能，原型里不演示' }); },
      lingxi: function () { this.$act('fake', { m: '灵犀首页是班课现有功能，原型里不演示' }); },      /* 真实：点 Logo / 灵犀图标跳灵犀首页 */
      avatar: function () { this.$act('fake', { m: '设置头像是班课现有功能，原型里不演示' }); },      /* 真实：点头像弹"设置头像" */
      command: function () { this.$act('fake', { m: '原型里不退出登录' }); },
      /* 点卡片：已读，关闭小面板，跳到该学生的作文草稿 */
      openHelp: function (h) { this.bellShow = false; this.$act('openHelp', { id: h.id }); },
      readAll: function () { this.$act('readHelps', {}); },
      setStatus: function (c) { this.readStatus = c; }
    }
  },
  '<div class="layout-header-content">' +
    '<div class="content">' +
      '<div :class="isCollapse ? \'logo-box col-logo-box\' : \'logo-box nocol-logo-box\'" @click="lingxi" style="cursor: pointer;">' +
        '<img v-if="!isCollapse" src="' + IMG + 'open-logo.svg" alt="">' +
        '<img v-if="isCollapse" src="' + IMG + 'close-logo.svg" alt="">' +
      '</div>' +
      '<div class="handle-icon" @click="$emit(\'toggle\')"><img src="' + IMG + 'handle-icon.svg" alt=""></div>' +
      '<div class="lingxi-ai-icon"><img src="' + IMG + 'lingxi.png" alt="灵犀首页" @click="lingxi"></div>' +
    '</div>' +
    /* 小铃铛（Notice.vue）：保留真实嵌套 Notice 根 div > .normal-notice + el-popover > .user-message */
    '<div>' +
      '<div class="normal-notice"><div class="notice-buttons"></div></div>' +
      '<el-popover v-model="bellShow" placement="bottom-end" width="450" trigger="manual" append-to-body>' +
        '<div class="messageTip-box">' +
          '<div class="messageTip-box-header">' +
            '<span style="float:left; font-size:18px; font-weight:600;">通知</span>' +
            '<div style="float:right; display: flex; align-items: center;">' +
              '<el-dropdown style="margin-right: 15px;" @command="setStatus">' +
                '<span class="el-dropdown-link" style="line-height:30px">{{ readStatus === \'unread\' ? \'未读消息\' : \'全部消息\' }}<i class="el-icon-arrow-down el-icon--right"></i></span>' +
                '<el-dropdown-menu slot="dropdown"><el-dropdown-item command="all">全部消息</el-dropdown-item><el-dropdown-item command="unread">未读消息</el-dropdown-item></el-dropdown-menu>' +
              '</el-dropdown>' +
              '<i class="el-icon-close" style="cursor: pointer; font-size: 16px;" @click="bellShow = false"></i>' +
            '</div>' +
          '</div>' +
          '<div><div>' +
            '<el-tabs v-model="bellTab">' +
              '<el-tab-pane name="all"><span slot="label">全部<el-badge :is-dot="false"></el-badge></span></el-tab-pane>' +
              '<el-tab-pane name="follow"><span slot="label">跟进提醒<el-badge :is-dot="false"></el-badge></span></el-tab-pane>' +
              '<el-tab-pane name="help"><span slot="label">作文求助<el-badge :is-dot="unread > 0"></el-badge></span></el-tab-pane>' +
              '<div class="messageTip-box-list">' +
                '<div v-if="shown.length">' +
                  '<div v-for="h in shown" :key="h.id" class="messageTip-box-item" :style="h.read ? \'color:#D1D1D1 \' : \'\'" style="cursor: pointer;" @click="openHelp(h)">' +
                    '<div class="messageTip-box-details"><div>' +
                      '<div class="messageTip-box-details-item notice-title" :class="{ \'is-read\': h.read }">{{ h.name }}发来作文求助</div>' +
                      '<div class="messageTip-box-details-item">{{ h.courseText }}</div>' +
                      '<div class="messageTip-box-details-item"><span class="notice-inline-gap">作文：《{{ h.title }}》</span><span>当前 {{ h.words }} 字</span></div>' +
                      '<div class="messageTip-box-details-item notice-footer"><div class="notice-time">{{ h.time }}</div><el-button type="text" class="notice-detail-btn">详情></el-button></div>' +
                    '</div></div>' +
                  '</div>' +
                '</div>' +
                '<div v-else style="position: absolute; top: 120px; left: 160px; font-size: 16px;">暂无消息记录</div>' +
              '</div>' +
            '</el-tabs>' +
          '</div></div>' +
          '<div class="messageTip-box-bottom" v-show="shown.length">' +
            '<el-button type="info" size="mini" icon="el-icon-check" circle @click="readAll"></el-button>' +
            '<span style="margin-left:5px;color:black">全部标记为已读</span>' +
          '</div>' +
        '</div>' +
        '<el-badge slot="reference" :value="unread" :hidden="unread === 0" :max="99" class="user-message"><img @click="bellShow = !bellShow" src="' + IMG + 'messageTip.svg" alt="消息通知"></el-badge>' +
      '</el-popover>' +
    '</div>' +
    '<div>' +
      '<el-popover :value="false" placement="bottom-end" width="450" trigger="manual" append-to-body>' +
        '<div></div>' +
        '<el-badge slot="reference" :value="3" :hidden="false" :max="99" class="todo-message"><img @click="todo" src="' + IMG + 'todo.svg" alt="待办事项"></el-badge>' +
      '</el-popover>' +
    '</div>' +
    '<div class="user-profile" @click="avatar"><span class="name-substitute">{{ctx.D.TEACHER}}</span></div>' +
    '<div class="user-name">' +
      '<el-dropdown trigger="click" @command="command">' +
        '<span class="el-dropdown-link"> {{ctx.D.TEACHER}} <i class="el-icon-arrow-down el-icon--right"></i></span>' +
        '<el-dropdown-menu slot="dropdown"><el-dropdown-item command="logout">退出登录</el-dropdown-item></el-dropdown-menu>' +
      '</el-dropdown>' +
    '</div>' +
  '</div>'));

  /* ------------------------------------------------------------------
   * app-shell：Layout（Index.vue）= Header + Menu + Breadcrumb + 内容区（插槽放页面）
   * 四个兄弟节点必须依次相邻（折叠联动靠兄弟选择器，见 shell/notes.md 第 5 节）
   * ------------------------------------------------------------------ */
  var ROUTERS = [
    { label: '班主任工作台', path: '/class-manage/head-teacher-workbench', icon: IMG + 'workbench.svg', activeIcon: IMG + 'workbench-active.svg',
      children: [{ path: 'my-sop-v3', label: '一站式工作台' }] },
    { label: '客户管理', path: '/class-manage/customer-manage', icon: IMG + 'customer-manage.svg', activeIcon: IMG + 'customer-manage-active.svg',
      children: [{ path: 'detail', label: '客户详情' }, { path: 'search', label: 'TMK查询客户' }] }
  ];

  Vue.component('app-shell', C({
    data: function () { return { isCollapse: false, routers: ROUTERS }; },
    computed: {
      /* v2：只有一站式工作台一个页面——选中项与展开项固定；面包屑隐藏（一站式工作台 hideBreadcrumb） */
      active: function () { return '/class-manage/head-teacher-workbench/my-sop-v3'; },
      openeds: function () { return ['0']; },
      bc: function () { return []; }
    },
    methods: {
      onSelect: function (idx) {
        if (idx.indexOf('/my-sop-v3') === -1) {
          this.$act('fake', { m: '这个原型只演示「一站式工作台」' });
          var menu = this.$refs.menu, me = this;
          this.$nextTick(function () { menu.updateActiveIndex(me.active); });   /* 把高亮还给当前页 */
        }
      }
    }
  },
  '<div id="app"><div class="app-container">' +
    '<shell-header :is-collapse="isCollapse" @toggle="isCollapse = !isCollapse"/>' +
    '<div class="sc_menu layout-menu-content" :class="{ menuCollapse: isCollapse, noMenuCollapse: !isCollapse }">' +
      '<el-menu ref="menu" active-color="#ffd04b" :unique-opened="true" :default-openeds="openeds" :default-active="active" :collapse="isCollapse" ' +
        ':class="isCollapse && \'el-none--collapse\'" class="el-menu-vertical" @select="onSelect">' +
        '<el-submenu v-for="(router, index) in routers" :key="\'submenu-\' + index" :index="\'\' + index">' +
          '<template slot="title">' +
            '<img class="icon-box" :src="active.search(router.path) !== -1 ? router.activeIcon : router.icon">' +
            '<span :class="isCollapse && \'noneSpan\'">{{ router.label }}</span>' +
          '</template>' +
          '<div class="submenu-scroll-container" :key="router.path + \'-\' + index">' +
            '<el-menu-item v-for="(item, i) in router.children" :key="item.path + i" :index="router.path + \'/\' + item.path">{{ item.label }}</el-menu-item>' +
          '</div>' +
        '</el-submenu>' +
      '</el-menu>' +
    '</div>' +
    '<el-breadcrumb separator="/" class="igetcool-breadcrumb" v-show="bc.length > 0">' +
      '<template v-for="(item, i) in bc">' +
        '<el-breadcrumb-item v-if="item.to" :key="\'l\' + i" :to="{ path: item.to }">{{ item.label }}</el-breadcrumb-item>' +
        '<el-breadcrumb-item v-else :key="\'t\' + i">{{ item.label }}</el-breadcrumb-item>' +
      '</template>' +
    '</el-breadcrumb>' +
    '<div class="router-view-content"><div class="router-view-container"><slot/></div></div>' +
  '</div></div>'));
})();
