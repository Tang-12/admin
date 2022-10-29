
<template>
  <el-dialog
      :title="title"
      append-to-body
      destroy-on-close
      :model-value="showDialog"
      @close="closeDialog()"
  >
      <!-- <span>{{ rowData }}</span> -->
      <!-- 表单内容 -->
      <el-form
          ref="formRef"
          :model="form"
          label-width="80px"
          :rules="rules"
          :validate-on-rule-change="false"
          :inline="false"
      >
        <el-form-item label="父级" prop="parentId">
            <el-cascader
                style="width: 100%"
                :options="menuList"
                v-model="parentId"
                clearable
                filterable
                :props="{
                    expandTrigger: 'hover',
                    emitPath: false,
                    checkStrictly: true,
                    value: 'id',
                    label: 'name',
                }"
                @change="cascaderChange"
                :disabled="title != '添加'"
            ></el-cascader>
      </el-form-item>
      <el-form-item label="名称" prop="name">
          <el-input v-model="name"></el-input>
      </el-form-item>
      </el-form>

      <template v-slot:footer>
          <span>
              <el-button @click="closeDialog()">取消</el-button>
              <el-button type="primary" @click="onSubmit()">确定</el-button>
          </span>
      </template>
  </el-dialog>
</template>

<script setup>
import { icons, treeFindPath } from "@/utils";
import { reactive, ref, toRefs, computed, nextTick, onMounted } from "vue";
/**
* @description: 获取文件路径
* @param {*}
* @return {*}
*/
const getfiles = () => {
  const files = require.context("@/views/layoutpages", true, /\.vue$/);
  return files
      .keys()
      .map((key) => {
          return {
              url: key.replace(/^(\.\/)|(\.vue)/g, ""),
              description:
                  files(key).default.data &&
                  (files(key).default.data().description || "无"),
              menus:
                  files(key).default.data &&
                  (files(key).default.data().menus || []),
          };
      })
      .filter((key) => {
          return !key.url.includes("/components/");
      });
};
// import { useStore } from "vuex";
const props = defineProps({
  showDialog: {
      type: Boolean,
      default: true,
  },
  title: {
      type: String,
      default: "添加",
  },
  rowData: {
      type: Object,
      default: null,
  },
  menuList: {
      type: Array,
      default: null,
  },
});
const emit = defineEmits(["closeDialog"]);

const { title, rowData, menuList } = toRefs(props);
const closeDialog = () => {
  emit("closeDialog", false);
};
const ve_icons = ref([]);
const formRef = ref(null);
const files = getfiles();
const form = reactive({
  name: "",
  type: 0,
  parentId: -1,
  menu: "",
  url: "",
  icon: "Menu",
  iframe: 1,
  sort: 1,
  toPath: "",
});
const { name, type, parentId, menu, url, icon, iframe, sort, toPath } =
  toRefs(form);
/**
* @description: 字段重置
* @param {*}
* @return {*}
*/
const resetForm = () => {
  name.value = "";
  menu.value = "";
  url.value = "";
  icon.value = "Menu";
  iframe.value = 1;
  sort.value = 1;
  toPath.value = "";
};

/**表单验证规则
* @description:
* @param {*} computed
* @return {*}
*/
const rules = computed(() => ({
  parentId: [
      {
          required: type.value == 2 ? true : false,
          message: "请选择父级菜单",
          trigger: "change",
      },
  ],
  name: [
      {
          required: type.value != 2 ? true : false,
          message: "请输入菜单名称",
          trigger: "blur",
      },
  ],
  menu: [
      {
          required: type.value == 2 ? true : false,
          message: "请选择按钮",
          trigger: "change",
      },
  ],
  icon: [
      {
          required: type.value != 2 ? true : false,
          message: "请选择图标",
          trigger: "change",
      },
  ],

  url: [
      {
          required: type.value == 1 ? true : false,
          pattern:
              /^(https?:\/\/)?(([a-zA-Z0-9_-])+(\.)?)*(:\d+)?(\/((\.)?(\?)?=?&?[a-zA-Z0-9_-](\?)?)*)*$/i,
          message: "url不正确",
          trigger: "change",
      },
  ],
}));
/**按钮目标菜单验证规则
* @description:
* @param {*} computed
* @return {*}
*/
const toPathRule = computed(() => [
  {
      required: changeToPath.value,
      message: "请选择目标菜单",
      trigger: "change",
  },
  {
      validator: (rule, value, callback) => {
          if (value == parentId.value) {
              callback(new Error("不可以选择当前父级菜单"));
          } else {
              callback();
          }
      },
      trigger: "change",
  },
]);

/**
* @description:初始化赋值
* @param {*}
* @return {*}
*/
rowData.value &&
  ((name.value = rowData.value.name),
  (type.value = rowData.value.type),
  (parentId.value = rowData.value.parentId),
  (url.value = rowData.value.url),
  (menu.value = rowData.value.menu),
  (icon.value = rowData.value.icon),
  (iframe.value = rowData.value.iframe),
  (toPath.value = rowData.value.toPath),
  (sort.value = rowData.value.sort));
/**
* @description: 类型切换事件
* @param {*}
* @return {*}
*/
const changeType = (val) => {
  nextTick(() => {
      formRef.value.resetFields();
  });
  val == 2 && (icon.value = "");
};
/**
* @description: 图标下拉框展开事件
* @param {*}
* @return {*}
*/
const handelOptionsChange = (flag) => {
  if (flag === true && ve_icons.value.length < 1) {
      ve_icons.value = icons();
  }
};

/**
* @description: 父级id切换事件
* @param {*}
* @return {*}
*/
const cascaderChange = () => {
  if (type.value == 2) {
      name.value = "";
      menu.value = "";
      nextTick(() => {
          formRef.value.clearValidate("menu");
      });
  }
};
/**
* @description:iframe切换事件
* @param {*}
* @return {*}
*/
const changeIframe = () => {
  url.value = "";
  nextTick(() => {
      if (rowData.value && iframe.value == rowData.value.iframe) {
          url.value = rowData.value.url;
      }
      formRef.value.clearValidate("url");
  });
};
/**
* @description:切换菜单按钮触发事件
* @param {*}
* @return {*}
*/
const changeMenu = () => {
  name.value = menuOptions.value[menu.value]["name"];
  toPath.value = "";
  nextTick(() => {
      if (rowData.value && menu.value == rowData.value.menu) {
          toPath.value = rowData.value.toPath;
      }
      formRef.value.clearValidate("toPath");
  });
};
/**
* @description: 控制跳转菜单是否显示
* @param {*}
* @return {*}
*/
const changeToPath = computed(() => {
  if (menuOptions.value && menu.value) {
      return menuOptions.value[menu.value]["toPath"];
  }
  return false;
});
/**
* @description: 按钮的禁用函数
* @param {*}
* @return {*}
*/
const typeItemDisabled = computed(() => (label) => {
  let flag = true;
  switch (title.value) {
      case "编辑":
          if (label == type.value) {
              flag = false;
          }
          break;
      case "添加子级":
          if (label == 0 || label == 1) {
              flag = false;
          }
          break;
      case "添加按钮":
          if (label == 2) {
              flag = false;
          }
          break;

      default:
          flag = false;
          break;
  }
  return flag;
});

/**
* @description:获取menus列表
* @param {*}
* @return {*}
*/
const menuOptions = computed(() => {
  // if (title.value == "添加" || title.value == "添加按钮") {
  let _item = XE.findTree(
      menuList.value,
      (item) => item.id == parentId.value
  );
  if (_item && files.find((item) => item.url == _item.item.url)) {
      return files.find((item) => item.url == _item.item.url).menus;
  } else {
      return false;
  }
  // }
});
/**
* @description: 已添加的按钮设为禁用
* @param {*}
* @return {*}
*/
const menuDisabled = computed(() => (key) => {
  let _item = XE.findTree(
      menuList.value,
      (item) => item.id == parentId.value
  );
  if (_item) {
      if (rowData.value && key == rowData.value.menu) {
          return false;
      }
      return (
          _item.item.children &&
          _item.item.children.find((item) => item.menu == key) &&
          true
      );
  }
});
/**
* @description: 监听title
* @param {*}
* @return {*}
*/
const watchTitle = () => {
  if (title.value == "添加按钮" || title.value == "添加子级") {
      resetForm();
      parentId.value = treeFindPath(
          menuList.value,
          (data) => data.id === rowData.value.id
      ).slice(-1)[0];
      title.value == "添加按钮" && ((type.value = 2), (icon.value = ""));
  }
};
onMounted(() => {
  watchTitle();
});
/**
* @description:提交表单
* @param {*}
* @return {*}
*/
const onSubmit = () => {
  formRef.value.validate(async (valid) => {
      if (valid) {
          let res;
          if (title.value.includes("添加")) {
              res = await VE_API.system.menuAdd(form);
          } else {
              res = await VE_API.system.menuEdit({
                  id: rowData.value.id,
                  ...form,
              });
          }
          const { code } = res;
          if (code == "00") {
              closeDialog();
          }
      } else {
          console.log("error submit!!");
          return false;
      }
  });
};
</script>

<style lang="scss" scoped></style>
