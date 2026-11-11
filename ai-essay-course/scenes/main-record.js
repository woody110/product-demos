/* =====================================================================
 * main-record.js —— 学员档案（灵活页签）：头部 + 页内页签「学情信息」「作文批改」
 * 「作文批改」沿用真实 EssayCorrectTab（_unused/main-archive.js 取自 src/components/student-archive/EssayCorrectTab.vue）的
 * 工具栏 + 时间轴卡片结构；列表 = 该学员所有 AI 作文课的作文（跨课程、含旧年级），按提交时间倒序。
 * 订正作文待批改 →「批改」（按登录人进入，可编辑）；已批改 / 首次作文 →「查看」（打开与学员列表相同的批改结果抽屉）。
 * 新增元素 class 用 x- 前缀，样式见 css/main-record.css。
 * ===================================================================== */
(function () {
  function C(opts, tpl) {
    var c = Vue.compile(tpl, { whitespace: 'condense' });
    opts.render = c.render;
    opts.staticRenderFns = c.staticRenderFns;
    return opts;
  }

  var TEMPLATE =
  '<div class="x-wb-rec x-rec">' +
    '<div class="x-wb-rec-head"><span class="x-wb-rec-avatar">{{ row.sname.charAt(0) }}</span>' +
      '<div class="x-wb-rec-info"><div class="x-wb-rec-name">{{ row.sname }}<span class="x-wb-rec-id">学员ID：{{ row.sid }}</span></div>' +
      '<div class="x-wb-rec-sub">{{ row.cls }}　{{ phone }}</div></div></div>' +

    '<el-tabs v-model="activeName" type="card">' +
      '<el-tab-pane label="学情信息" name="learning"><div class="x-rec-pane-empty">学情信息：沿用班课现有的学员档案页签，本原型不演示</div></el-tab-pane>' +
      '<el-tab-pane name="essayCorrect">' +
        '<span slot="label">作文批改<sup class="essay-tab-new">新</sup></span>' +

        '<div class="essay-correct-tab">' +
          '<div class="essay-correct-tab__toolbar">' +
            '<div class="essay-correct-tab__filters">' +
              '<el-select v-model="courseType" placeholder="全部课程类型" size="small">' +
                '<el-option label="全部课程类型" value=""></el-option>' +
                '<el-option label="体验课" value="trial"></el-option>' +
                '<el-option label="正式课" value="formal"></el-option>' +
                '<el-option label="AI作文课" value="ai"></el-option>' +
              '</el-select>' +
              '<el-select v-model="grade" placeholder="全部年级" size="small">' +
                '<el-option label="全部年级" value=""></el-option>' +
                '<el-option label="三年级" value="三年级"></el-option>' +
                '<el-option label="四年级" value="四年级"></el-option>' +
              '</el-select>' +
              '<el-select v-model="status" placeholder="全部状态" size="small">' +
                '<el-option label="全部状态" value=""></el-option>' +
                '<el-option label="待批改" value="pending"></el-option>' +
                '<el-option label="已批改" value="graded"></el-option>' +
              '</el-select>' +
            '</div>' +
            '<div class="essay-correct-tab__actions">' +
              '<span class="essay-correct-tab__total">共 {{ list.length }} 篇符合条件的批改记录</span>' +
            '</div>' +
          '</div>' +

          '<div class="essay-correct-tab__timeline">' +
            '<div v-if="!list.length" class="essay-correct-tab__empty">暂无批改记录</div>' +
            '<div v-for="(item, index) in pageList" :key="item.id" class="essay-node" :class="{ \'is-last\': index === pageList.length - 1 }">' +
              '<div class="essay-node__rail"><span class="essay-node__dot"></span><span class="essay-node__line"></span></div>' +
              '<div class="essay-node__content">' +
                '<div class="essay-node__time">{{ timeText(item.submit) }}</div>' +
                '<div class="essay-node__card">' +
                  '<div class="essay-node__head">' +
                    '<div class="essay-node__head-main">' +
                      '<div class="essay-node__title-row">' +
                        '<span class="essay-node__title">《{{ item.title }}》</span>' +
                        '<span class="essay-node__tag x-ai">AI作文课</span>' +
                        '<span class="essay-node__tag" :class="item.kind === \'second\' ? \'x-kind-rev\' : \'x-kind-first\'">{{ item.kind === \'second\' ? \'订正\' : \'首次\' }}</span>' +
                      '</div>' +
                      '<div class="essay-node__subtitle">{{ subtitle(item) }}</div>' +
                    '</div>' +
                    '<span class="essay-node__actions">' +
                      '<el-button type="text" size="small" @click.stop="view(item)">查看</el-button>' +
                      '<el-button v-if="item.kind === \'second\' && item.status === \'pending\'" type="text" size="small" class="x-rec-go" @click.stop="goGrade(item)">批改</el-button>' +
                    '</span>' +
                  '</div>' +
                  '<div class="essay-node__body"><div class="essay-node__main"></div></div>' +
                  '<div class="essay-node__foot">' +
                    '<span v-if="item.kind === \'second\' && item.status === \'graded\'" class="essay-node__foot-item">批改老师：{{ teacherName(item.gradedBy) }}</span>' +
                    '<span class="essay-node__foot-item">批改状态：<span class="essay-node__status" :class="item.status === \'graded\' ? \'is-done\' : \'is-pending\'">{{ item.status === \'graded\' ? \'已批改\' : \'待批改\' }}</span></span>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div v-if="list.length > pageSize" class="cool-desktop-pagination">' +
            '<el-pagination background :current-page="currentPage" :page-size="pageSize" :total="list.length" :page-sizes="[10, 20, 30, 40, 50]" ' +
              'layout="total, sizes, prev, pager, next, jumper" @size-change="onSize" @current-change="onPage"></el-pagination>' +
          '</div>' +
        '</div>' +
      '</el-tab-pane>' +
    '</el-tabs>' +

    '<essay-result-drawer :essay-id="repId" :visible.sync="repShow" @grade="goGrade"></essay-result-drawer>' +
  '</div>';

  Vue.component('student-record', C({
    props: ['row'],
    data: function () {
      return { activeName: 'essayCorrect', courseType: '', grade: '', status: '', currentPage: 1, pageSize: 10, repShow: false, repId: null };
    },
    computed: {
      D: function () { return this.ctx.D || {}; },
      phone: function () { var p = String(this.row.phone || ''); return p.length === 11 ? p.substring(0, 3) + '****' + p.substring(7) : p; },
      /* 该学员所有 AI 作文课的作文（跨课程、含旧年级），按提交时间倒序；体验课 / 正式课没有记录 */
      list: function () {
        var self = this, sid = this.row.sid, C = this.D.COURSES || {};
        return (this.ctx.E || []).filter(function (e) { return e.sid === sid; })
          .filter(function (e) {
            if (self.courseType === 'trial' || self.courseType === 'formal') return false;
            if (self.grade && String((C[e.course] || {}).title || '').indexOf(self.grade) !== 0) return false;
            if (self.status && e.status !== self.status) return false;
            return true;
          })
          .sort(function (a, b) { return a.submit < b.submit ? 1 : a.submit > b.submit ? -1 : 0; });
      },
      pageList: function () { var s = (this.currentPage - 1) * this.pageSize; return this.list.slice(s, s + this.pageSize); }
    },
    watch: {
      courseType: function () { this.currentPage = 1; },
      grade: function () { this.currentPage = 1; },
      status: function () { this.currentPage = 1; }
    },
    methods: {
      /* 原型数据只有 月-日 时:分；真实列表是 YYYY-MM-DD HH:mm:ss */
      timeText: function (t) { return t ? '2026-' + t + ':00' : '-'; },
      /* 「三年级下·第3课」：年级学期 + 课节序号 */
      subtitle: function (e) {
        var c = (this.D.COURSES || {})[e.course] || {}, term = String(c.title || '').split('·')[0];
        var l = ((this.D.LESSONS || {})[e.course] || []).filter(function (x) { return x.id === e.lesson; })[0];
        return term + '·' + (l ? String(l.name).split(' ')[0] : '');
      },
      teacherName: function (k) { return ((this.D.TEACHERS || {})[k] || {}).name || '-'; },
      onSize: function (n) { this.pageSize = n; this.currentPage = 1; },
      onPage: function (n) { this.currentPage = n; },
      view: function (item) { this.repId = item.id; this.repShow = true; },
      /* 从学员档案进入批改：按登录人，可编辑 */
      goGrade: function (item) { this.repShow = false; this.$act('openEssay', { id: item.id, ro: false }); }
    }
  }, TEMPLATE));
})();
