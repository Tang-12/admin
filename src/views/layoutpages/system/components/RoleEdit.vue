<template>
    <el-dialog
        :title="title"
        append-to-body
        destroy-on-close
        :model-value="showDialog"
        @close="closeDialog()"
    >
        <!-- <span>{{ rowData }}</span> -->
        <!-- 表单 -->
        <el-form
            :model="form"
            ref="formRef"
            :rules="rules"
            label-width="80px"
            :inline="false"
        >
            <el-form-item label="名称" prop="name">
                <el-input v-model="name" placeholder="" clearable></el-input>
            </el-form-item>
            <el-form-item label="描述" prop="roleName">
                <el-input
                    v-model="desc"
                    placeholder=""
                    clearable
                ></el-input>
            </el-form-item>
            <el-form-item class="ve_role_item" label="权限" prop="role">
                <el-card
                    shadow="never"
                    :body-style="{ padding: 0, height: '200px' }"
                >
                    <el-scrollbar>
                        <el-tree
                            ref="tree"
                            :data="menuList"
                            node-key="id"
                            default-expand-all
                            :props="{ label: 'name' }"
                            empty-text="暂无数据"
                            show-checkbox
                            highlight-current
                        >
                            <template v-slot="{ data }">
                                <span
                                    :data-roleId="data.id"
                                    :class="{ ve_tree_item: data.type == 2 }"
                                >
                                    {{ data.name }}
                                </span>
                            </template>
                        </el-tree>
                    </el-scrollbar>
                    <!-- card body -->
                </el-card>
            </el-form-item>
            <el-form-item label="状态" prop="status">
                <el-radio-group v-model="status">
                    <el-radio-button :label="0">启用</el-radio-button>
                    <el-radio-button :label="1">停用</el-radio-button>
                </el-radio-group>
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
import { onMounted, reactive, ref, toRefs, nextTick } from "vue";
import { treeFindPath } from "@/utils";

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
});
const emit = defineEmits(["closeDialog"]);
const { title, rowData } = toRefs(props);
const closeDialog = () => {
    emit("closeDialog", false);
};
const form = reactive({
    name: "",
    desc: "",
    role: [],
    status: 1,
});
const loading = ref(true);
const { name, desc,role, status } = toRefs(form);
const formRef = ref(null);
const rules = {
    name: [
        {
            required: true,
            message: "请输入角色名",
            trigger: "blur",
        },
    ],
    role: [
        {
            validator: (rule, value, callback) => {
                role.value = [
                    ...tree.value.getCheckedNodes(),
                    ...tree.value.getHalfCheckedNodes(),
                ];
                if (role.value.length < 1) {
                    callback(new Error("请选择权限"));
                } else {
                    callback();
                }
            },
            required: true,
        },
    ],
};
const tree = ref(null);
const menuList = ref([]);
/**
 * @description: 数据初始化
 * @param {*}
 * @return {*}
 */
rowData.value &&
    ((name.value = rowData.value.name),
    (desc.value = rowData.value.desc),
    (status.value = rowData.value.status));
/**
 * @description:提交
 * @param {*}
 * @return {*}
 */
const onSubmit = () => {
    formRef.value.validate(async (valid) => {
        let auth_id = tree.value.getCheckedKeys();
        if (valid) {
            let res;
            if (title.value == "添加") {
                res = await VE_API.system.roleAdd(
                    {
                        name: form.name,
                        desc: form.desc,
                        auth_id: auth_id,
                    }
                );
            } else {
                res = await VE_API.system.roleEdit({
                    id: rowData.value.id,
                    name: form.name,
                    desc: form.desc,
                    auth_id: auth_id,
                });
            }
            const { code } = res;
            if (code == "200") {
                closeDialog();
            }
        } else {
            console.log("error submit!!");
            return false;
        }
    });
};

/**
 * @description: 获取菜单数据
 * @param {*}
 * @return {*}
 */
const getMenuList = async () => {
    const { code, data } = await VE_API.system.menuList(
        {
            limit: 10,
            page: 1,
            total: 0,
        },
        { Global: false }
    );
    if (code == "200") {
        const list = XE.mapTree(
            XE.toArrayTree(data, {
                sortKey: "sort",
            }),
            (item) => {
                if (item.children.length <= 0) {
                    delete item.children;
                }
                return item;
            }
        );
        menuList.value = list;
    }
};

/**
 * @description:改变按钮的排列样式
 * @param {*}
 * @return {*}
 */
const setMenuStyle = () => {
    let eles = document.getElementsByClassName("ve_tree_item");
    Array.from(eles).forEach((e) => {
        const roleId = e.dataset.roleid * 1;
        const index =
            treeFindPath(menuList.value, (item) => item.id == roleId).length -
            1;
        e.parentNode.parentNode.parentNode.style.paddingLeft =
            index * 18 + "px";
        let oldClass = e.parentNode.className;
        e.parentNode.className = oldClass + " fl p0";
    });
};
onMounted(async () => {
    await getMenuList();
    nextTick(() => {
        setMenuStyle();
        if (title.value == "添加") {
            tree.value.setCheckedNodes(menuList.value);
        } else {
            let treeArr = [];
            for(let i in rowData.value.auth_ids) {
                treeArr.push(rowData.value.auth_ids[i]);
            };
                treeArr.forEach(value => { 
                    tree.value.setChecked(value, true, false);
                }) 
            }
    });
});
</script>

<style lang="scss">
body {
    .ve_role_item {
        .el-form-item__content {
            display: block !important;
        }
    }
}
.fl {
    float: left;
}
.p0 {
    padding: 0 !important;
}
</style>
