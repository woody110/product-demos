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
    methods: {
      todo: function () { this.$act('fake', { m: '待办面板是班课现有功能，原型里不演示' }); },
      lingxi: function () { this.$act('fake', { m: '灵犀首页是班课现有功能，原型里不演示' }); },      /* 真实：点 Logo / 灵犀图标跳灵犀首页 */
      avatar: function () { this.$act('fake', { m: '设置头像是班课现有功能，原型里不演示' }); },      /* 真实：点头像弹"设置头像" */
      command: function () { this.$act('fake', { m: '原型里不退出登录' }); }
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
