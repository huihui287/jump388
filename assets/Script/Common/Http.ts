/**
 * Http请求
 */
 import UrlConfig from "./UrlConfig";

 const { ccclass, property } = cc._decorator;
 
 
 
 @ccclass
 export default class Http {
 
     /**
      * Http返回状态
      */
     public static Code = {
         /**
          * 成功
          */
         OK: 200,
         ZHAN:402
     };
 
     public static readonly UrlConfig = UrlConfig;
     static rootUrl: string = Http.UrlConfig.rootUrl;
 
     private xhr: XMLHttpRequest;
     private isCancel: boolean = false;
 
     private constructor() {
 
         this.xhr = new XMLHttpRequest();
         this.xhr.timeout = 10000;//超时10秒
     }
 
     public static send({
         mountNode = null as cc.Node,//挂载节点
         tag = null as any,//请求标识
         url = null as string,//请求地址
         data = {} as any,//请求数据
         method = 'POST',//请求方式
         success = (result, tag?) => { },//成功回调
         error = null as Function,//失败回调
         async = true }) {
         if (!url) {
             return;
         }
         if (!/^http/.test(url) && Http.rootUrl) {
             url = Http.rootUrl + url;
         }
         cc.log('request url:%s method:%s', url, method);
 
         if (!data.tk) {
             // let time = new Date().getTime();
             // data.tk = App.encryptByDES(App.UserManager.uid + "|" + time);
             // if (App.UserManager.u) {
             //     data.u = App.UserManager.u;
             // }
         }
 
         cc.log(JSON.stringify(data));
 
         let http = new Http();
         http.request({
             mountNode: mountNode,
             tag: tag,
             url: url,
             data: data,
             method: method,
             success: success,
             error: error,
             async: async
         });
         cc.log('sendsendsendsendsendsendsend', url, method);
         return http;
 
     }
 
     /**
      * 不要调用此方法,调用底部的静态call方法
      * 说明->查看底部调用入口
      */
     private request({
         mountNode = null as cc.Node,
         tag = null as any,
         url = null as string,
         data = {},
         method = 'GET',
         success = (result, tag?) => { },
         error = null as Function,
         async = true }) {
         method = method || 'GET';
 
         let dataPair = "";
         for (let k in data) {
             if (dataPair != "") {
                 dataPair += "&";
             }
             dataPair += k + "=" + encodeURIComponent(data[k]);
         }
 
         if (method == "GET" && dataPair != "") {
             if (url.indexOf("?") == -1) {
                 url += "?";
             }
             url += dataPair;
         }
 
         let errCallback = (msg) => {
             if (this.isCancel) {
                 cc.log('request canceled!');
                 return;
             }
             if (mountNode != null && !cc.isValid(mountNode)) {//挂载节点已销毁
                 return;
             }
             if (error) {
                 error(msg, tag);
                 error = null;
             }
         }
 
         this.xhr.onreadystatechange = () => {
             if (this.xhr.readyState == 4 && !this.isCancel) {
                 if (this.xhr.status >= 200 && this.xhr.status <= 400) {
                     let response = this.xhr.responseText;
                     try {
                         cc.log(response);
                         if (response.indexOf('{') == 0) {
                             cc.log("f",response);
                             response = JSON.parse(response);
                         }
                         if (mountNode != null && !cc.isValid(mountNode)) {//挂载节点已销毁
                             return;
                         }
                         if (success) {
                             success(response, tag);
                         }
                     } catch (e) {
                         cc.error(e);
                     }
                 } else {
                     cc.warn('http request problem:' + this.xhr.status);
                     errCallback('连接失败:' + this.xhr.status);
                 }
             }
         };
 
         this.xhr.onerror = (e) => {
             cc.error('http request onerror');
             errCallback('连接失败，请检查网络');
         };
 
         this.xhr.ontimeout = () => {
             cc.error('http request ontimeout');
             errCallback('连接超时');
         };
 
         this.xhr.open(method, url, async);
 
         this.xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
       
 
        //this.xhr.setRequestHeader("Access-Control-Allow-Origin", "application/x-www-form-urlencoded");
        //this.xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
 
         if (method == "GET") {
             cc.log('send Get!!');
             this.xhr.send();
         } else if (method == "POST") {
             cc.log('send Post!!');
             this.xhr.send(dataPair);
         } else {
             cc.log('[HTTP] no send');
         }
     }
 
     cancel() {
         this.isCancel = true;
     }
 }
 