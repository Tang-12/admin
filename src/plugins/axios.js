
import axios from "axios";
import Qs from "qs";
import NProgress from "nprogress";
import { SET_TOKEN } from "@/store/modules/app/type";

// Full config:  https://github.com/axios/axios#request-config
// axios.defaults.baseURL = process.env.baseURL || process.env.apiUrl || '';
// axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
// axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
const install = (app, { router, store, opt }) => {
    let config = {
        Global: true,
        baseURL: 'http://localhost/index.php/api/v1/',
        timeout: 60 * 1000, // Timeout
        // withCredentials: true, // Check cross-site Access-Control
    };
    /* if (VE_ENV.MODE === "production") {
        
    } */
    // config.transformRequest = [(data) => Qs.parse(data)];
    const _axios = axios.create(config);
    let ve_loading;
    let ve_message = null;
    let loadingCount = 0;
    // 请求拦截
    _axios.interceptors.request.use(
        (config) => {
            NProgress.done();
            if (config.Global) {
                NProgress.start();
                ve_loading = app.config.globalProperties.$loading({
                    lock: true,
                    text: "Loading",
                    spinner: "el-icon-loading",
                    background: "rgba(0,0,0,0.1)",
                });
            }
            loadingCount++;
            //*请求头添加token
            config.headers.Authorization = window.localStorage.getItem('token');
            config.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
            config.data =Qs.stringify(config.data);
            return config;
        },
        (error) => {
            // Do something with request error
            return Promise.reject(error);
        }
    );

    // Add a response interceptor
    // 响应拦截
    _axios.interceptors.response.use(
        (response) => {
            // TODO 根据响应头更新token
            store.dispatch(`app/${SET_TOKEN}`, new Date().getTime());

            loadingCount--;
            if (loadingCount <= 0) {
                NProgress.done();
                ve_loading.close();
            }
            let type = "success";
            if (response.data.code != "200") {
                type = "error";
            }
            if(response.data.code == "403"){
                window.localStorage.removeItem('token');
                router.replace({
                    name: "Login",
                });
            }
            if (ve_message) {
                ve_message.close();
                ve_message = null;
            }
            ve_message = app.config.globalProperties.$message({
                type,
                message: response.data.msg,
            });
            // Do something with response data
            return response.data;
        },
        (error) => {
            loadingCount--;
            if (loadingCount <= 0) {
                NProgress.done();
                ve_loading.close();
            }
            if (error && error.response) {
                console.log(error.response);
                let message = "";
                switch (error.response.status) {
                    case 0:
                        message = "系统异常，请重新登录";
                        window.localStorage.removeItem('token');
                        router.replace({
                            name: "Login",
                        });
                        break;
                    case 400:
                        message = "请求错误";
                        break;
                    case 401: {
                        message = "未授权，请登录";
                        break;
                    }
                    case 403:
                        message = "没有权限，拒绝访问";
                        break;
                    case 404:
                        message = `请求地址出错`;
                        break;
                    case 405:
                        message = `请求方法出错`;
                        break;
                    case 408:
                        message = "请求超时";
                        break;
                    case 500:
                        message = "服务器内部错误";
                        break;
                    case 501:
                        message = "服务未实现";
                        break;
                    case 502:
                        message = "网关错误";
                        break;
                    case 503:
                        message = "服务不可用";
                        break;
                    case 504:
                        message = "网关超时";
                        break;
                    case 505:
                        message = "HTTP版本不受支持";
                        break;
                    default:
                        break;
                }
                if (ve_message) {
                    ve_message.close();
                    ve_message = null;
                }
                ve_message = app.config.globalProperties.$message({
                    message,
                    type: "error",
                });
            }
            // Do something with response error
            return Promise.reject(error);
        }
    );

    const method = {
        post: (url, p, config) => _axios.post(url, p, config),
        get: (url, p, config) =>
            _axios.get(url, Object.assign(config, { params: p })),
    };

    let api = {};
    const files = require.context("@/api/modules", false, /\.js$/);
    files.keys().forEach((key) => {
        const fileName = key.replace(/(\.\/|\.js)/g, "");
        api[fileName] = {};
        let obj = files(key);
        Object.keys(obj).forEach((item) => {
            api[fileName][item] = (p, config = {}) =>
                method[obj[item].type](obj[item].url, p, config);
        });
    });

    window[opt] = api;
    app.config.globalProperties[opt] = api;
};

export default { install };