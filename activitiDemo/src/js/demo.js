/**
 * Created by lenovo on 2017/7/24.
 */

class Activiti {
    constructor(){
        this.addDom=null
        this.addArea=null
        this.paintArea=null
        this.flowCreatData=null//储存流程开始时的数据
        this.operateArr=[]//用于储存操作
    }
    //一些单独方法
    getRandString(){//随机生成6位数的大写字母
        let result=[]
        for(var i=0;i<6;i++){
            var ranNum = Math.ceil(Math.random() * 25); //生成一个0到25的数字
            //大写字母'A'的ASCII是65,A~Z的ASCII码就是65 + 0~25;然后调用String.fromCharCode()传入ASCII值返回相应的字符并push进数组里
            result.push(String.fromCharCode(65+ranNum));
        }
        let resultSring=result.join("")
        return resultSring
    }
    changeName(end){//降终点上下左右转换成点的className
        switch (end) {
            case "top":
                end="dotT"
                break;
            case "bottom":
                end="dotB"
                break;
            case "left":
                end="dotL"
                break;
            default:
                end="dotR"
        }
        return end
    }
    clickDocument(){//点击文档隐藏一些东西
        document.onmousedown=function (e) {
            let ev=e||window.event
            if(ev.target.tagName!="LI"&&ev.target.className!="del"){
                $(".flowIcon,.tiaoJianIcon").find("ul").remove()
            }
        }
    }


    //启动整个流程相关方法
    init(domId){
       let container=document.getElementById(domId)
       let html="<header>" +
                   "<div class='addArea' draggable='true'>" +
                   "<span class='add'>添加流程</span></div>" +
                   '<span class="addTiaojian" draggable="true">条件</span>'+
                   "<button class='delFlow'>删除</button>" +
                   "<button class='saveFlow'id='saveFlowBtn'>保存</button>"+
               "</header>"
        //属性添加div
        html+='<div class="setArea">' +
                '<h3>节点属性</h3>'+
                '<div class="flowForm"><label for="flowName">名称</label><input type="text" id="flowName"></div>' +
                '<div class="flowForm"><label for="flowDutyMan">负责人</label><input type="text" id="flowDutyMan"readonly class="inputRead"></div>' +
                '<div class="flowForm"><label for="flowOption">属性</label><input type="text" id="flowOption"readonly class="inputRead"></div>' +
                '<div class="flowForm"><label for="flowBelong">性质</label><input type="text" id="flowBelong"readonly class="inputRead"></div>' +
                '</div>'
        //画图区域div
        html+='<div id="paintArea">' +
               '<svg id="paintSvg" xmlns="http://www.w3.org/2000/svg" version="1.1">' +
               '<defs> ' +
                   '<marker id="arrow" markerWidth="10" markerHeight="10" refx="0" refy="2" orient="auto" markerUnits="strokeWidth"> ' +
                   '<path d="M0,0 L0,4 L4,2 z" fill="rgb(89, 171, 228)" /> ' +
                   '</marker> ' +
               '</defs>' +
               '</svg>'+
               '</div>'
        container.innerHTML=html
        this.addDom=document.querySelectorAll(".add")[0]
        this.addArea=document.querySelectorAll(".addArea")[0]
        this.addTiaojian=document.querySelectorAll(".addTiaojian")[0]
        if(sessionStorage.isFirstEdit!="false"){
            this.ininStartEnd()
        }else{
            this.lookFlow()
        }

        this.deleteLine()
        this.addNode()
        this.clickDocument()
        this.saveFlow()
    }
    getStartId(){//获取开始流程ID
         let that=this
         let html='<div class="flowStartBox">' +
                  '<header>开始流程</header>'+
                  '<section>' +
                  '<div class="flowFlex2"><label for="startName">流程名称</label><input id="startName"type="text"maxlength="15"></div>' +
                  //'<div class="flowFlex2"><label for="startDescribe">流程描述</label><textarea id="startDescribe"maxlength="150"></textarea></div>'+
                  '</section>'+
                  '<footer><button id="startFlowBtn">确定</button></footer>'
                  '</div>'
         let cover='<div class="flowCover"></div>'
         $("body").append(html)
         $("body").append(cover)
         $("#startFlowBtn").click(function () {
             $(this).attr("disabled",true)
             let $this=$(this)
             $(".flowStartBox").find(".errorTips").remove()
             let name=$("#startName").val()
             let des=$("#startDescribe").val()
             if(name.trim().length==""){
                 $(".flowStartBox").find("section").append('<p class="errorTips">流程名称不能为空！</p>')
                 $this.attr("disabled",false)
                 return
             }
             let postData={
                 name:name,
                 description:des,
                 key:that.getRandString()
             }
             Vue.http.post('/api/model/create',postData).
             then(function (data) {
                     console.log(data)
                     if(data.status==200){
                         let res=data.body
                         sessionStorage.flowStartId=res.id
                         sessionStorage.flowStartName=res.name
                         sessionStorage.flowStartDes=res.description
                         sessionStorage.flowStartKey=res.key
                         that.flowCreatData=res
                         $(".flowStartBox,.flowCover").remove()
                     }
             }, function () {
                 $(".flowStartBox").find("section").append('<p class="errorTips">创建流程失败！</p>')
                 $this.attr("disabled",false)
             });
         })
    }
    lookFlow(){//如果编辑过的就从后台获取流程
        let that=this
        Vue.http.post('/api/model/get',{id:sessionStorage.flowStartId}).
        then(function (data) {
            console.log(data)
            if(data.status==200){
                  let dom=JSON.parse(data.body.description)
                  console.log(dom)
                  for(let i=0;i<dom.line.length;i++){
                      let svgDom=dom.line[i]
                      let g=document.createElementNS("http://www.w3.org/2000/svg", "g");
                      for(let key in svgDom){
                          if(key!="child"){
                              g.setAttribute(key,svgDom[key])
                          }else{
                              let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                              for(let sub in svgDom.child){
                                  path.setAttribute(sub,svgDom.child[sub])
                              }
                              g.appendChild(path)
                          }
                      }
                      g.onclick=function () {
                          that.svgLineClick($(this))
                      }
                      document.getElementById("paintSvg").appendChild(g)
                  }


                  for(let j=0;j<dom.task.length;j++){
                      let taskDom=dom.task[j]
                      $("#paintArea").append(taskDom)
                  }
                   $("#paintArea").find("div").each(function () {
                        that.moveFlowIcon(this)//可移动节点
                        that.paintArrow(this)//画线
                        that.deletFlow(this)
                    })

            }
        }, function () {

        });
    }
    ininStartEnd(){//初始化开始和结束节点
        let start='<div class="flowIcon" data-row="FLOWSTART" style="left: 400px; top: 100px;"data-name="开始">' +
                    '<span>开始</span>' +
                    '<i class="dotL" data-row="FLOWSTART"></i>' +
                    '<i class="dotR" data-row="FLOWSTART"></i>' +
                    '<i class="dotT" data-row="FLOWSTART"></i>' +
                    '<i class="dotB" data-row="FLOWSTART"></i>' +
                  '</div>'
        let end='<div class="flowIcon" data-row="FLOWEND" style="left: 400px; top: 400px;"data-name="结束">' +
                    '<span>结束</span>' +
                    '<i class="dotL" data-row="FLOWSTART"></i>' +
                    '<i class="dotR" data-row="FLOWSTART"></i>' +
                    '<i class="dotT" data-row="FLOWSTART"></i>' +
                    '<i class="dotB" data-row="FLOWSTART"></i>' +
                '</div>'
        $("#paintArea").append(start+end)
        let moveDomStart=$(".flowIcon[data-row='FLOWSTART']").get(0)
        let moveDomEnd=$(".flowIcon[data-row='FLOWEND']").get(0)
        this.moveFlowIcon(moveDomStart)
        this.paintArrow(moveDomStart)
        this.moveFlowIcon(moveDomEnd)
        this.paintArrow(moveDomEnd)
        if(!sessionStorage.flowStartId){
            this.getStartId()//获取开始流程ID
        }

    }
    deleteLine(){//删除线
        $(".delFlow").click(function () {
            $("#paintArea").find(".checked").remove()
        })
    }
    deletFlow(movedDom){//删除节点
        $(movedDom).find("img").mousedown(function (e) {
            let ev=e||window.event
            ev.stopPropagation()
            ev.preventDefault()
        })
        $(movedDom).find("img").click(function (e) {
            let ev=e||window.event
            ev.stopPropagation()
            $(this).next().remove()
            let html='<ul><li class="del">删除节点</li></ul>'
            $(this).after(html)
            $(this).next().find("li").click(function (e) {
                let ev=e||window.event
                ev.stopPropagation()
                let dataRow=$(movedDom).attr("data-row")
                $("#paintSvg").find("g").each(function () {
                    if($(this).attr("data-path").indexOf(dataRow)>-1){
                        $(this).remove()
                    }
                })
                $(movedDom).remove()

            })
            $(this).next().find("li").mousedown(function (e) {
                let ev=e||window.event
                ev.stopPropagation()
                ev.preventDefault()
            })
        })
    }
    svgLineClick(g){//当点击画好的线后的操作
        $("#paintArea").find(".flowIcon,.tiaoJianIcon").removeClass("chosed")
        $("#flowName").attr("readonly",true).addClass("inputRead")
        $("#flowName").val("")
        $("#flowDutyMan").val()
        $("#flowOption").val("连接线")
        $("#flowBelong").val("SequenceFlow")
        $("#paintArea").find("g").not(g).removeClass("checked")
        $("#paintArea").find("g").not(g).find("path").removeAttr("stroke-dasharray")
        if(g.hasClass("checked")){
            g.removeClass("checked")
            g.find("path").removeAttr("stroke-dasharray")
        }else{
            g.addClass("checked")
            g.find("path").attr("stroke-dasharray","10")
        }
        let from=g.attr("data-path").split("-")[0]
        $(".setArea").find(".areaIF").remove()
        let isFromIf=false
        $("#paintArea").find(".tiaoJianIcon").each(function () {
            if(from==$(this).attr("data-row")){
                isFromIf=true
            }
        })

        if(isFromIf==true){
            let html='<div class="flowForm areaIF"><label for="flowIF">条件</label><input type="text" id="flowIF"placeholder="填写表达式，如${status=0}"></div>'
            if(g.hasClass("checked")){
                $(".setArea").append(html)
                let gIF=g.attr("data-if")
                $("#flowIF").val(gIF?gIF:"")
                $("#flowIF").on("blur",function () {
                    g.attr("data-if",$(this).val())
                })
            }
        }

    }

    addNode(){//向绘图区域添加节点
        let addArea=this.addArea  //获取添加节点
        let addTiaojian=this.addTiaojian
        let paintArea=document.getElementById("paintArea")
        this.paintArea=paintArea
        let x
        let y
        let that=this
        paintArea.ondrop=function (e) {//在目标对象里释放
            let ev=window.event||e
            let belongSring=that.getRandString()//用来标识某个节点路程
            ev.preventDefault();
            let data=ev.dataTransfer.getData("Text");
            console.log(data)
            let movedDom=document.createElement("div")
            if(data=="addArea"){
                movedDom.setAttribute("class","flowIcon")
            }else{
                movedDom.setAttribute("class","tiaoJianIcon")
            }
            movedDom.setAttribute("data-row",belongSring)
            movedDom.setAttribute("data-name",(data=="addArea"?"添加流程":"条件"))
            let innerH='<span>'+(data=="addArea"?"添加流程":"条件")+'</span>'
                innerH+='<i class="dotL" data-row="'+belongSring+'"></i>' +
                    '<i class="dotR" data-row="'+belongSring+'"></i>' +
                    '<i class="dotT" data-row="'+belongSring+'"></i>' +
                    '<i class="dotB" data-row="'+belongSring+'"></i>'+
                    '<img src="./src/img/shenglue.png">'
            movedDom.innerHTML=innerH
            document.getElementById("paintArea").appendChild(movedDom)
            let movedDomWidth=movedDom.offsetWidth
            let movedDomHeight=movedDom.offsetHeight
            movedDom.style.setProperty("left",(x-movedDomWidth/2)>0?(x-movedDomWidth/2)+"px":0)
            movedDom.style.setProperty("top",(y-movedDomHeight/2)>0?(y-movedDomHeight/2)+"px":0)
            that.moveFlowIcon(movedDom)//可移动节点
            that.paintArrow(movedDom)//画线
            that.deletFlow(movedDom)
        }
        paintArea.ondragover=function (e) {//源对象悬停在目标对象上
            let ev=window.event||e
            ev.preventDefault();
            let mouseX=ev.clientX
            let mouseY=ev.clientY
            let paintAreaOffsetX=paintArea.offsetLeft
            let paintAreaOffsetY=paintArea.offsetTop
            let scrollTop=paintArea.scrollTop
            let scrollLeft=paintArea.scrollLeft
            let windowScrollY=window.scrollY
            let windowScrollX=window.scrollX
            x=mouseX-paintAreaOffsetX+scrollLeft+windowScrollX
            y=mouseY-paintAreaOffsetY+scrollTop+windowScrollY
        }
        addArea.ondragstart=function (e) {//源对象开始被拖动
            let ev=window.event||e
            let className=ev.target.className
            ev.dataTransfer.setData("Text",className);
        }
        addTiaojian.ondragstart=function (e) {
            let ev=window.event||e
            let className=ev.target.className
            ev.dataTransfer.setData("Text",className);
        }
    }
    moveFlowIcon(movedDom){//可在绘图区域内移动节点
        console.log(movedDom,1)
        let isDown=false
        let x
        let y
        let that=this
        let startX
        let startY
        const drag=function(ev) {

            let mouseX=ev.clientX
            let mouseY=ev.clientY
            //console.log(mouseX,mouseY)
            if(mouseX==startX&&mouseY==startY){
                return
            }
            let paintAreaOffsetX=that.paintArea.offsetLeft
            let paintAreaOffsetY=that.paintArea.offsetTop
            //获取滚动条的高度
            let scrollTop=that.paintArea.scrollTop
            let scrollLeft=that.paintArea.scrollLeft
            let windowScrollY=window.scrollY
            let windowScrollX=window.scrollX

            //console.log("top"+scrollTop)
            x=mouseX-paintAreaOffsetX+scrollLeft+windowScrollX
            y=mouseY-paintAreaOffsetY+scrollTop+windowScrollY
            let movedDomWidth=movedDom.offsetWidth
            let movedDomHeight=movedDom.offsetHeight
            movedDom.style.setProperty("left",(x-movedDomWidth/2)>0?(x-movedDomWidth/2)+"px":0)
            movedDom.style.setProperty("top",(y-movedDomHeight/2)>0?(y-movedDomHeight/2)+"px":0)

        }
        const dragOver=function () {
            //当移动超出视野范围之后，svg的宽高一起发生变化
            let allMoveDom=document.querySelectorAll(".flowIcon")
            let containerW=that.paintArea.offsetWidth
            let containerH=that.paintArea.offsetHeight
            let maxLeft=0
            let maxTop=0
            let svg=document.getElementById("paintSvg")
            for(let i=0;i<allMoveDom.length;i++){
                let left=allMoveDom[i].offsetLeft
                let width=allMoveDom[i].offsetWidth
                let top=allMoveDom[i].offsetTop
                let height=allMoveDom[i].offsetHeight
                //console.log(left+width,containerW)
                if(left+width>containerW){
                    if(left+width>maxLeft){
                        maxLeft=left+width
                    }
                }
                if(top+height>containerH){
                    if(top+height>maxTop){
                        maxTop=top+height
                    }
                }
            }
            //console.log("max="+maxLeft)
            if(maxLeft!=0){
                svg.style.width=maxLeft
            }
            if(maxTop!=0){
                svg.style.height=maxTop
            }
        }
        movedDom.onmousedown=function (e) {
            let ev=window.event||e
            ev.preventDefault();
            isDown=true
            startX=ev.clientX
            startY=ev.clientY
            that.bindData(this)
            document.onmousemove=function (e) {
                let ev=window.event||e
                if(isDown==true){
                    drag(ev)
                    that.moveChangeSvg(movedDom)
                }
            }
            this.onmouseup=function (e) {
                let ev=window.event||e
                ev.preventDefault();
                isDown=false
                dragOver()
            }
            document.onmouseup=function (e) {
                let ev=window.event||e
                ev.preventDefault();
                isDown=false
                dragOver()
            }
        }



    }
   //画线
    paintArrowGetPath(startX,startY,x,y,direct,nearlyName){//获取画线的路径，svg path
        let pathD
        let flowWidth=document.querySelector(".flowIcon").offsetWidth/2
        let flowHeight=document.querySelector(".flowIcon").offsetHeight

        //获取滚动条高度
        let scrollTop=this.paintArea.scrollTop
        let scrollLeft=this.paintArea.scrollLeft
        let windowScrollY=window.scrollY
        let windowScrollX=window.scrollX
        startX+=scrollLeft+windowScrollX
        startY+=scrollTop+windowScrollY
        console.log(direct,nearlyName)
        if(nearlyName==undefined){//如果没有进入流程div内
            x+=scrollLeft+windowScrollX
            y+=scrollTop+windowScrollY
            switch (direct) {
                case "dotB":
                    if(x-startX<=0&&y-startY>=0){//往左下
                        if(y-startY<30){ //当Y移动不超过30时
                            pathD="M"+startX+","+startY+" L"+startX+","+(startY+30)+" L"+x+","+(startY+30)+" L"+x+","+y
                        }else{
                            pathD="M"+startX+","+startY+" L"+startX+","+(y+startY)/2+" L"+x+","+(y+startY)/2+" L"+x+","+y
                        }

                    }
                    if(x-startX<=0&&startY-y>0){//往左上

                        if(startX-x<flowWidth){ //当鼠标往左移动小于节点的一半
                            pathD="M"+startX+","+startY+" L"+startX+","+(startY+30)+" L"+(startX-flowWidth-30)+","+(startY+30)+
                                " L"+(startX-flowWidth-30)+","+y+" L"+x+","+y
                        }else{
                            pathD="M"+startX+","+startY+" L"+startX+","+(startY+30)+" L"+x+","+(startY+30)+" L"+x+","+y
                        }
                    }
                    if(x-startX>0&&y-startY>=0){//往右下
                        if(y-startY<30){ //当Y移动不超过30时
                            pathD="M"+startX+","+startY+" L"+startX+","+(startY+30)+" L"+x+","+(startY+30)+" L"+x+","+y
                        }else{
                            pathD="M"+startX+","+startY+" L"+startX+","+(y+startY)/2+" L"+x+","+(y+startY)/2+" L"+x+","+y
                        }
                    }
                    if(x-startX>0&&startY-y>0){//往右上
                        if(x-startX<flowWidth){ //当鼠标往左移动小于节点的一半
                            pathD="M"+startX+","+startY+" L"+startX+","+(startY+30)+" L"+(startX+flowWidth+30)+","+(startY+30)+
                                " L"+(startX+flowWidth+30)+","+y+" L"+x+","+y
                        }else{
                            pathD="M"+startX+","+startY+" L"+startX+","+(startY+30)+" L"+x+","+(startY+30)+" L"+x+","+y
                        }
                    }
                    break;
                case "dotT":
                    if(x-startX<=0&&startY-y>0){//往左上
                        if(startY-y<30){ //当Y移动不超过30时
                            pathD="M"+startX+","+startY+" L"+startX+","+(startY-30)+" L"+x+","+(startY-30)+" L"+x+","+y
                        }else{
                            pathD="M"+startX+","+startY+" L"+startX+","+(y+startY)/2+" L"+x+","+(y+startY)/2+" L"+x+","+y
                        }
                    }
                    if(x-startX>0&&startY-y>0){//往右上
                        if(startY-y<30){ //当Y移动不超过30时
                            pathD="M"+startX+","+startY+" L"+startX+","+(startY-30)+" L"+x+","+(startY-30)+" L"+x+","+y
                        }else{
                            pathD="M"+startX+","+startY+" L"+startX+","+(y+startY)/2+" L"+x+","+(y+startY)/2+" L"+x+","+y
                        }
                    }
                    if(x-startX<=0&&startY-y<=0){//往左下
                        if(startX-x<flowWidth){ //当鼠标往左移动小于节点的一半
                            pathD="M"+startX+","+startY+" L"+startX+","+(startY-30)+" L"+(startX-flowWidth-30)+","+(startY-30)+
                                " L"+(startX-flowWidth-30)+","+y+" L"+x+","+y
                        }else{
                            pathD="M"+startX+","+startY+" L"+startX+","+(startY-30)+" L"+x+","+(startY-30)+" L"+x+","+y
                        }
                    }
                    if(x-startX>0&&startY-y<=0){
                        if(x-startX<flowWidth){ //当鼠标往左移动小于节点的一半
                            pathD="M"+startX+","+startY+" L"+startX+","+(startY-30)+" L"+(startX+flowWidth+30)+","+(startY-30)+
                                " L"+(startX+flowWidth+30)+","+y+" L"+x+","+y
                        }else{
                            pathD="M"+startX+","+startY+" L"+startX+","+(startY-30)+" L"+x+","+(startY-30)+" L"+x+","+y
                        }
                    }
                    break;
                case "dotL":
                    if(x-startX<=0&&startY-y>0){//往左上
                        if(startX-x<30){
                            pathD="M"+startX+","+startY+" L"+(startX-30)+","+startY+" L"+(startX-30)+","+y+" L"+x+","+y
                        }else{
                            pathD="M"+startX+","+startY+" L"+x+","+startY+" L"+x+","+y
                        }
                    }
                    if(x-startX>0&&startY-y>0){//往右上
                        pathD="M"+startX+","+startY+" L"+(startX-30)+","+startY+" L"+(startX-30)+","+y+" L"+x+","+y
                    }
                    if(x-startX<=0&&startY-y<=0){//往左下
                        if(startX-x<30){
                            pathD="M"+startX+","+startY+" L"+(startX-30)+","+startY+" L"+(startX-30)+","+y+" L"+x+","+y
                        }else{
                            pathD="M"+startX+","+startY+" L"+x+","+startY+" L"+x+","+y
                        }
                    }
                    if(x-startX>0&&startY-y<=0){//往右下
                        pathD="M"+startX+","+startY+" L"+(startX-30)+","+startY+" L"+(startX-30)+","+y+" L"+x+","+y
                    }
                    break;
                default:
                    if(x-startX<=0&&startY-y>0){//往左上
                        pathD="M"+startX+","+startY+" L"+(startX+30)+","+startY+" L"+(startX+30)+","+y+" L"+x+","+y
                    }
                    if(x-startX<=0&&startY-y<=0){//往左下
                        pathD="M"+startX+","+startY+" L"+(startX+30)+","+startY+" L"+(startX+30)+","+y+" L"+x+","+y
                    }
                    if(x-startX>0&&startY-y>0){//往右上
                        if(x-startX<30){
                            pathD="M"+startX+","+startY+" L"+(startX+30)+","+startY+" L"+(startX+30)+","+y+" L"+x+","+y
                        }else{
                            pathD="M"+startX+","+startY+" L"+x+","+startY+" L"+x+","+y
                        }
                    }
                    if(x-startX>0&&startY-y<=0){//往右下
                        if(x-startX<30){
                            pathD="M"+startX+","+startY+" L"+(startX+30)+","+startY+" L"+(startX+30)+","+y+" L"+x+","+y
                        }else{
                            pathD="M"+startX+","+startY+" L"+x+","+startY+" L"+x+","+y
                        }
                    }
            }
        }

       if(nearlyName){
           switch (direct) {
               case "dotT":
                     if(nearlyName=="left"){
                         x-=6
                         if(x-startX>0&&y-startY<0){
                             pathD="M"+startX+","+startY+" L"+startX+","+(y+startY)/2+" L"+(x+startX)/2+","+(y+startY)/2+" L"+(x+startX)/2+","+y+
                                     " L"+x+","+y
                         }
                         if(x-startX>0&&y-startY>=0){
                             pathD="M"+startX+","+startY+" L"+startX+","+(startY-30)+" L"+(x+startX)/2+","+(startY-30)+
                                     " L"+(x+startX)/2+","+y+" L"+x+","+y
                         }
                         if(x-startX<=0&&y-startY<0){
                             pathD="M"+startX+","+startY+" L"+startX+","+(startY+y)/2+" L"+(x-30)+","+(startY+y)/2+
                                     " L"+(x-30)+","+y+" L"+x+","+y
                         }
                         if(x-startX<=0&&y-startY>=0){
                             pathD="M"+startX+","+startY+" L"+startX+","+(startY-30)+" L"+(x-30)+","+(startY-30)+
                                    " L"+(x-30)+","+y+' L'+x+","+y
                         }
                     }
                     if(nearlyName=="right"){
                         x+=6
                         if(x-startX>0&&y-startY<0){
                             pathD="M"+startX+","+startY+" L"+startX+","+(y+startY)/2+" L"+(x+30)+","+(y+startY)/2+
                                    " L"+(x+30)+","+y+" L"+x+","+y
                         }
                         if(x-startX>0&&y-startY>=0){
                             pathD="M"+startX+","+startY+" L"+startX+","+(startY-30)+" L"+(x+30)+","+(startY-30)+
                                     " L"+(x+30)+","+y+" L"+x+","+y
                         }
                         if(x-startX<=0&&y-startY<0){
                             pathD="M"+startX+","+startY+" L"+startX+","+(y+startY)/2+" L"+(x+startX)/2+","+(y+startY)/2+" L"+(x+startX)/2+","+y+
                                 " L"+x+","+y
                         }
                         if(x-startX<=0&&y-startY>=0){
                             pathD="M"+startX+","+startY+" L"+startX+","+(startY-30)+" L"+(x+startX)/2+","+(startY-30)+
                                     " L"+(x+startX)/2+","+y+" L"+x+","+y
                         }
                     }
                     if(nearlyName=="top"){
                         y-=6
                         if(y-startY<0){
                             pathD="M"+startX+","+startY+" L"+startX+","+(y-30)+" L"+x+","+(y-30)+" L"+x+","+y
                         }
                         if(y-startY>=0){
                             pathD="M"+startX+","+startY+" L"+startX+","+(startY-30)+" L"+x+","+(startY-30)+" L"+x+","+y
                         }
                     }
                     if(nearlyName=="bottom"){
                         y+=6
                         if(y-startY<0){
                             pathD="M"+startX+","+startY+" L"+startX+","+(startY+y)/2+" L"+x+","+(startY+y)/2+" L"+x+","+y
                         }
                         if(y-startY>=0){
                             pathD="M"+startX+","+startY+" L"+startX+","+(startY-30)+" L"+(x+startX)/2+","+(startY-30)+
                                    " L"+(x+startX)/2+","+(y+30)+" L"+x+","+(y+30)+" L"+x+","+y
                         }
                     }
                     break;
               case "dotB":
                   if(nearlyName=="left"){
                       x-=6
                       if(x-startX<0&&y-startY<0){
                           pathD="M"+startX+","+startY+" L"+startX+","+(startY+30)+" L"+(x-30)+","+(startY+30)+" L"+
                               (x-30)+","+y+" L"+x+","+y
                       }
                       if(x-startX>=0&&y-startY<0){
                           pathD="M"+startX+","+startY+" L"+startX+","+(startY+30)+" L"+(x+startX)/2+","+(startY+30)+
                                   " L"+(x+startX)/2+","+y+" L"+x+","+y
                       }
                       if(x-startX<0&&y-startY>=0){
                           pathD="M"+startX+","+startY+" L"+startX+","+(y+startY)/2+" L"+(x-30)+","+(y+startY)/2+
                                   " L"+(x-30)+","+y+" L"+x+","+y
                       }
                       if(x-startX>=0&&y-startY>=0){
                           pathD="M"+startX+","+startY+" L"+startX+","+(y+startY)/2+" L"+(x+startX)/2+","+(y+startY)/2+" L"+(x+startX)/2+","+y+
                               " L"+x+","+y
                       }
                   }
                   if(nearlyName=="right"){
                       x+=6
                       if(x-startX<0&&y-startY<0){
                           pathD="M"+startX+","+startY+" L"+startX+","+(startY+30)+" L"+(x+startX)/2+","+(startY+30)+
                               " L"+(x+startX)/2+","+y+" L"+x+","+y
                       }
                       if(x-startX>=0&&y-startY<0){
                           pathD="M"+startX+","+startY+" L"+startX+","+(startY+30)+" L"+(x+30)+","+(startY+30)+" L"+
                               (x+30)+","+y+" L"+x+","+y
                       }
                       if(x-startX<0&&y-startY>=0){
                           pathD="M"+startX+","+startY+" L"+startX+","+(y+startY)/2+" L"+(x+startX)/2+","+(y+startY)/2+" L"+(x+startX)/2+","+y+
                               " L"+x+","+y
                       }
                       if(x-startX>=0&&y-startY>=0){
                           pathD="M"+startX+","+startY+" L"+startX+","+(y+startY)/2+" L"+(x+30)+","+(y+startY)/2+
                               " L"+(x+30)+","+y+" L"+x+","+y
                       }
                   }
                   if(nearlyName=="top"){
                       y-=6
                       if(y-startY<0){
                           pathD="M"+startX+","+startY+" L"+startX+","+(startY+30)+" L"+(x+startX)/2+","+(startY+30)+
                                   " L"+(x+startX)/2+","+(y-30)+" L"+x+","+(y-30)+" L"+x+","+y
                       }
                       if(y-startY>=0){
                           pathD="M"+startX+","+startY+" L"+startX+","+(y+startY)/2+" L"+x+","+(y+startY)/2+" L"+x+","+y

                       }
                   }
                   if(nearlyName=="bottom"){
                       y+=6
                       if(y-startY<0){
                           pathD="M"+startX+","+startY+" L"+startX+","+(startY+30)+" L"+x+","+(startY+30)+" L"+x+","+y
                       }
                       if(y-startY>=0){
                           pathD="M"+startX+","+startY+" L"+startX+","+(y+30)+" L"+x+","+(y+30)+" L"+x+","+y
                       }
                   }
                   break;
               case "dotL":
                   if(nearlyName=="left"){
                       x-=6
                       if(x-startX<0){
                           pathD="M"+startX+","+startY+" L"+(x-30)+","+startY+" L"+(x-30)+","+y+" L"+x+","+y
                       }else{
                           pathD="M"+startX+","+startY+" L"+(startX-30)+","+startY+" L"+(startX-30)+","+y+" L"+x+","+y
                       }
                   }
                   if(nearlyName=="right"){
                       x+=6
                       if(x-startX<0){
                           pathD="M"+startX+","+startY+" L"+(x+startX)/2+","+startY+" L"+(x+startX)/2+","+y+" L"+x+","+y
                       }else{
                           pathD="M"+startX+","+startY+" L"+(startX-30)+","+startY+" L"+(startX-30)+","+(y+startY)/2+
                                   " L"+(x+30)+","+(y+startY)/2+" L"+(x+30)+","+y+" L"+x+","+y
                       }
                   }
                   if(nearlyName=="top"){
                       y-=6
                       if(x-startX<0&&y-startY<0){
                           pathD="M"+startX+","+startY+" L"+(x+startX)/2+","+startY+" L"+(x+startX)/2+","+(y-30)+" L"+x+","+(y-30)+
                                   ' L'+x+","+y
                       }
                       if(x-startX>=0&&y-startY<0){
                           pathD="M"+startX+","+startY+" L"+(startX-30)+","+startY+" L"+(startX-30)+","+(y-30)+" L"+x+","+(y-30)+
                                  " L"+x+","+y
                       }
                       if(x-startX<0&&y-startY>=0){
                           pathD="M"+startX+","+startY+" L"+(x+startX)/2+","+startY+" L"+(x+startX)/2+","+(y+startY)/2+" L"+x+","+(y+startY)/2+
                               " L"+x+","+y
                       }
                       if(x-startX>=0&&y-startY>=0){
                           pathD="M"+startX+","+startY+" L"+(startX-30)+","+startY+" L"+(startX-30)+","+(y+startY)/2+
                                   " L"+x+","+(y+startY)/2+" L"+x+","+y
                       }
                   }
                   if(nearlyName=="bottom"){
                       y+=6
                       if(x-startX<0&&y-startY<0){
                           pathD="M"+startX+","+startY+" L"+(x+startX)/2+","+startY+" L"+(x+startX)/2+","+(y+startY)/2+" L"+x+","+(y+startY)/2+
                               " L"+x+","+y
                       }
                       if(x-startX>=0&&y-startY<0){
                           pathD="M"+startX+","+startY+" L"+(startX-30)+","+startY+" L"+(startX-30)+","+(y+startY)/2+
                               " L"+x+","+(y+startY)/2+" L"+x+","+y
                       }
                       if(x-startX<0&&y-startY>=0){
                           pathD="M"+startX+","+startY+" L"+(x+startX)/2+","+startY+" L"+(x+startX)/2+","+(y+30)+" L"+x+","+(y+30)+
                               ' L'+x+","+y
                       }
                       if(x-startX>=0&&y-startY>=0){
                           pathD="M"+startX+","+startY+" L"+(startX-30)+","+startY+" L"+(startX-30)+","+(y+30)+" L"+x+","+(y+30)+
                               " L"+x+","+y
                       }
                   }
                   break;
               default:
                   if(nearlyName=="left"){
                       x-=6
                       if(x-startX<0){
                           pathD="M"+startX+","+startY+" L"+(startX+30)+","+startY+" L"+(startX+30)+","+(y+startY)/2+
                                   " L"+(x-30)+","+(y+startY)/2+" L"+(x-30)+","+y+" L"+x+","+y
                       }else{
                           pathD="M"+startX+","+startY+" L"+(x+startX)/2+","+startY+" L"+(x+startX)/2+","+y+" L"+x+","+y
                       }
                   }
                   if(nearlyName=="right"){
                       x+=6
                       if(x-startX<0){
                           pathD="M"+startX+","+startY+" L"+(startX+30)+","+startY+" L"+(startX+30)+","+y+" L"+x+","+y
                       }else{
                           pathD="M"+startX+","+startY+" L"+(x+30)+","+startY+" L"+(x+30)+","+y+" L"+x+","+y
                       }
                   }
                   if(nearlyName=="top"){
                       y-=6
                       if(x-startX<0&&y-startY<0){
                           pathD="M"+startX+","+startY+" L"+(startX+30)+","+startY+" L"+(startX+30)+","+(y-30)+
                                   " L"+x+","+(y-30)+" L"+x+","+y
                       }
                       if(x-startX>=0&&y-startY<0){
                           pathD="M"+startX+","+startY+" L"+(x+startX)/2+","+startY+" L"+(x+startX)/2+","+(y-30)+
                                   " L"+x+","+(y-30)+" L"+x+","+y
                       }
                       if(x-startX<0&&y-startY>=0){
                           pathD="M"+startX+","+startY+" L"+(startX+30)+","+startY+" L"+(startX+30)+","+(y+startY)/2+
                                   " L"+x+","+(y+startY)/2+" L"+x+","+y
                       }
                       if(x-startX>=0&&y-startY>=0){
                           pathD="M"+startX+","+startY+" L"+(x+startX)/2+","+startY+" L"+(x+startX)/2+","+(y+startY)/2+" L"+x+","+(y+startY)/2+
                               " L"+x+","+y
                       }
                   }
                   if(nearlyName=="bottom"){
                       y+=6
                       if(x-startX<0&&y-startY<0){
                           pathD="M"+startX+","+startY+" L"+(startX+30)+","+startY+" L"+(startX+30)+","+(y+startY)/2+
                               " L"+x+","+(y+startY)/2+" L"+x+","+y
                       }
                       if(x-startX>=0&&y-startY<0){
                           pathD="M"+startX+","+startY+" L"+(x+startX)/2+","+startY+" L"+(x+startX)/2+","+(y+startY)/2+" L"+x+","+(y+startY)/2+
                               " L"+x+","+y
                       }
                       if(x-startX<0&&y-startY>=0){
                           pathD="M"+startX+","+startY+" L"+(startX+30)+","+startY+" L"+(startX+30)+","+(y+30)+
                               " L"+x+","+(y+30)+" L"+x+","+y
                       }
                       if(x-startX>=0&&y-startY>=0){
                           pathD="M"+startX+","+startY+" L"+(x+startX)/2+","+startY+" L"+(x+startX)/2+","+(y+30)+
                               " L"+x+","+(y+30)+" L"+x+","+y
                       }

                   }
           }

       }

        return pathD
    }

    paintArrow(moveDom){
        let isDown=false
        let startX
        let startY
        let endX
        let endY
        let svgContainer=document.getElementById("paintSvg")
        let that=this
        let direct

        //当鼠标移动的时候绘图
        const paint=function (groupData,dataRow,cursorNode) {
            let mouseX=cursorNode.clientX//鼠标位置x
            let mouseY=cursorNode.clientY//鼠标位置y
            let paintAreaX=that.paintArea.offsetLeft
            let paintAreaY=that.paintArea.offsetTop
            let x=mouseX-paintAreaX
            let y=mouseY-paintAreaY
            let nearlyName //获取最近点名称
            /*计算最近点*/
            let endDom//获取指向节点
            if(cursorNode.target.className=="flowIcon"||cursorNode.target.className=="tiaoJianIcon"){
                endDom=cursorNode.target
            }
            if(cursorNode.target.parentNode.className=="flowIcon"||cursorNode.target.parentNode.className=="tiaoJianIcon"){
                endDom=cursorNode.target.parentNode
            }
            //console.log(endDom)

            if(cursorNode.target.className=="flowIcon"||cursorNode.target.parentNode.className=="flowIcon"
                ||cursorNode.target.className=="tiaoJianIcon"||cursorNode.target.parentNode.className=="tiaoJianIcon"){
                //计算出指向节点的上下左右四个位置坐标
                let endDomT={}
                let endDomB={}
                let endDomL={}
                let endDomR={}
                endDomT.x=endDom.offsetLeft+endDom.offsetWidth/2
                endDomT.y=endDom.offsetTop
                endDomB.x=endDom.offsetLeft+endDom.offsetWidth/2
                endDomB.y=endDom.offsetTop+endDom.offsetHeight
                endDomL.x=endDom.offsetLeft
                endDomL.y=endDom.offsetTop+endDom.offsetHeight/2
                endDomR.x=endDom.offsetLeft+endDom.offsetWidth
                endDomR.y=endDom.offsetTop+endDom.offsetHeight/2
             //   console.log(endDomT,endDomB,endDomL,endDomR)
                //比较鼠标离哪个点更近
                let curToEndDomT=Math.sqrt(Math.pow((x-endDomT.x),2)+Math.pow((y-endDomT.y),2))
                let curToEndDomB=Math.sqrt(Math.pow((x-endDomB.x),2)+Math.pow((y-endDomB.y),2))
                let curToEndDomL=Math.sqrt(Math.pow((x-endDomL.x),2)+Math.pow((y-endDomL.y),2))
                let curToEndDomR=Math.sqrt(Math.pow((x-endDomR.x),2)+Math.pow((y-endDomR.y),2))
                let destination=[]
                destination.push(
                    {name:"top", num:curToEndDomT},
                    {name:"bottom", num:curToEndDomB},
                    {name:"left", num:curToEndDomL},
                    {name:"right", num:curToEndDomR}
                )
                let nearly=100000
                for(let i=0;i<destination.length;i++){
                    if(destination[i].num<nearly){
                        nearly=destination[i].num
                        nearlyName=destination[i].name
                    }
                }
               // console.log(nearly,nearlyName)
                switch (nearlyName) {
                    case "top":
                        x=endDomT.x
                        y=endDomT.y
                        break;
                    case "bottom":
                        x=endDomB.x
                        y=endDomB.y
                        break;
                    case "left":
                        x=endDomL.x
                        y=endDomL.y
                        break;
                    default:
                        x=endDomR.x
                        y=endDomR.y
                }
            }
            /*计算最近点*/


            //绘制直线属性
            /*groupData.line.setAttribute("x1",startX)
            groupData.line.setAttribute("y1",startY)
            groupData.line.setAttribute("x2",x)
            groupData.line.setAttribute("y2",y)
            groupData.line.setAttribute("marker-end","url(#arrow)")//箭头
            groupData.line.style.stroke="rgb(89, 171, 228)"
            groupData.line.style.strokeWidth="2px"*/
            //获取绘制路径属性
            let pathD=that.paintArrowGetPath(startX,startY,x,y,direct,nearlyName)

            groupData.path.setAttribute("d",pathD)
            groupData.path.setAttribute("fill","transparent")
            groupData.path.setAttribute("stroke","#59ABE4")
            groupData.path.setAttribute("stroke-width","2")
            groupData.path.setAttribute("marker-end","url(#arrow)")
            groupData.group.setAttribute("data-start",direct)
            groupData.group.setAttribute("data-end",nearlyName)
            endX=x
            endY=y

        }
        //鼠标释放
        const dragOver=function (groupData,dataRow,cursorNode) {
            /*//判断是否其他节点往开始节点画线
            if(cursorNode.target.getAttribute("data-row")=="FLOWSTART"||cursorNode.target.parentNode.getAttribute("data-row")=="FLOWSTART"){
                groupData.group.remove()
                return
            }*/
            //判断是否进入另外一个节点
            if(cursorNode.target.className=="flowIcon"||cursorNode.target.parentNode.className=="flowIcon"
                ||cursorNode.target.className=="tiaoJianIcon"||cursorNode.target.parentNode.className=="tiaoJianIcon"){
                if(cursorNode.target.getAttribute("data-row")!=dataRow&&cursorNode.target.parentNode.getAttribute("data-row")!=dataRow){
                     let start=dataRow
                     let end=cursorNode.target.getAttribute("data-row")||cursorNode.target.parentNode.getAttribute("data-row")
                     let svgArea=document.getElementById("paintSvg")
                     let svgGroup=svgArea.childNodes
                     console.log(svgGroup)
                     for(let i=0;i<svgGroup.length;i++){
                         if(svgGroup[i].tagName=="g"){
                             if(svgGroup[i].getAttribute("data-path")==(start+"-"+end)){
                                 svgGroup[i].remove()
                             }
                         }
                     }
                     groupData.group.setAttribute("data-path",start+"-"+end)
                     $(groupData.group).click(function () {
                         that.svgLineClick($(this))
                     })
                }else{
                   // groupData.group.remove()
                }
            }else{
                groupData.group.remove()
            }
        }

        moveDom.addEventListener("mousedown",function (e) {
            let ev=window.event||e
            isDown=true
            if(ev.target.parentNode.getAttribute("data-row")=="FLOWEND"){
                return
            }
            if(ev.target.nodeName=='I'){
                document.onmousemove=null
                document.onmouseup=null
                this.onmouseup=null
                direct=ev.target.className //标记哪个点按下的
                let directDom=ev.target//获取画线的起始点的dom节点
                startX=ev.clientX-that.paintArea.offsetLeft
                startY=ev.clientY-that.paintArea.offsetTop
                //创建一个组
                let group=document.createElementNS("http://www.w3.org/2000/svg", "g");
                //创建一条路径
                let path=document.createElementNS("http://www.w3.org/2000/svg", "path");

                svgContainer.appendChild(group)
                group.appendChild(path)
                let groupData={//包含svg组的一些信息
                    group:group,
                    path:path
                }
                let dataRow=ev.target.getAttribute("data-row")//获取开始画线的起始点的data-row属性
                document.onmousemove=function (e) {
                    let ev=window.event||e
                    if(isDown==true){
                        console.log("huaxianmove")
                        paint(groupData,dataRow,ev)
                    }
                }
                this.onmouseup=function (e) {
                    let ev=window.event||e
                    ev.preventDefault();
                    isDown=false
                    dragOver(groupData,dataRow,ev)
                }
                document.onmouseup=function (e) {
                    let ev=window.event||e
                    ev.preventDefault();
                    if(isDown==true){
                        dragOver(groupData,dataRow,ev)
                    }
                    isDown=false
                }
            }
        })


    }

//当流程节点移动的时候，折线图随之移动
    moveChangeSvg(movedDom){
        console.log(movedDom)
        let svg=document.querySelectorAll("g")
        console.log(movedDom.offsetLeft,movedDom.offsetTop)
        console.log(svg)
        if(!svg){
            return
        }
        let flowDivChildren=movedDom.childNodes
        console.log(flowDivChildren)
        for (let i=0;i<svg.length;i++){
            let start=svg[i].getAttribute('data-start')
            let end =this.changeName(svg[i].getAttribute("data-end"))
            let pathStart=svg[i].getAttribute("data-path").split("-")[0]
            let pathEnd=svg[i].getAttribute("data-path").split("-")[1]
            if(movedDom.getAttribute("data-row")==pathStart){
                 for(let j=0;j<flowDivChildren.length;j++){
                     if(flowDivChildren[j].className==start){
                         let startX=movedDom.offsetLeft+flowDivChildren[j].offsetLeft+flowDivChildren[j].offsetWidth/2
                         let startY=movedDom.offsetTop+flowDivChildren[j].offsetTop+flowDivChildren[j].offsetHeight/2
                         console.log(startX,startY)
                         let path=svg[i].childNodes[0].getAttribute("d")
                         let pathArr=path.split(" ")
                         console.log(pathArr)
                         pathArr[0]="M"+startX+","+startY

                         if(start=="dotT"||start=="dotB"){
                             let pathArr1=pathArr[1]
                             let pathArr1Y=pathArr1.split(",")[1]
                             let pathArr1New="L"+startX+","+pathArr1Y
                             pathArr[1]=pathArr1New
                             svg[i].childNodes[0].setAttribute("d",pathArr.join(" "))
                         }
                         if(start=="dotL"||start=="dotR"){
                             let pathArr1=pathArr[1]
                             let pathArr1X=pathArr1.split(",")[0]
                             let pathArr1New=pathArr1X+","+startY
                             pathArr[1]=pathArr1New
                             svg[i].childNodes[0].setAttribute("d",pathArr.join(" "))
                         }
                     }
                 }
            }
            if(movedDom.getAttribute("data-row")==pathEnd){
                for(let k=0;k<flowDivChildren.length;k++){
                    if(flowDivChildren[k].className==end){
                        let endX=movedDom.offsetLeft+flowDivChildren[k].offsetLeft+flowDivChildren[k].offsetWidth/2
                        let endY=movedDom.offsetTop+flowDivChildren[k].offsetTop+flowDivChildren[k].offsetHeight/2
                        let path=svg[i].childNodes[0].getAttribute("d")
                        let pathArr=path.split(" ")
                        let length=pathArr.length

                        console.log(pathArr,length)
                        if(end=="dotT"||end=="dotB"){
                            let pathArrLast2=pathArr[length-2]
                            let pathArrLast2Y=pathArrLast2.split(",")[1]
                            let pathArrLast2New="L"+endX+","+pathArrLast2Y

                            let pathArrLast3=pathArr[length-3]
                            let pathArrLast3X=pathArrLast3.split(",")[0]
                            let pathArrLast3New
                            pathArrLast2New="L"+endX+","+(end=="dotT"?endY-30:endY+30)
                            pathArrLast3New=pathArrLast3X+","+(end=="dotT"?endY-30:endY+30)

                            pathArr[length-1]="L"+endX+","+(end=="dotT"?endY-6:endY+6)
                            pathArr[length-2]=pathArrLast2New
                            pathArr[length-3]=pathArrLast3New
                            let pathString=pathArr.join(" ")
                            console.log(pathString)
                            svg[i].childNodes[0].setAttribute("d",pathString)
                        }


                       if(end=="dotL"||end=="dotR"){
                            let pathArrLast2=pathArr[length-2]
                            let pathArrLast2X=(end=="dotL"?endX-30:endX+30)
                            let pathArrLast2New="L"+pathArrLast2X+","+endY
                            let pathArrLast3=pathArr[length-3]
                            let pathArrLast3Y=pathArrLast3.split(",")[1]
                            let pathArrLast3New=pathArrLast2X+","+pathArrLast3Y
                            pathArr[length-1]="L"+(end=="dotL"?endX-6:endX+6)+","+endY
                            pathArr[length-2]=pathArrLast2New
                            pathArr[length-3]=pathArrLast3New
                            svg[i].childNodes[0].setAttribute("d",pathArr.join(" "))
                        }

                    }
                }
            }
        }
    }
  //以下为节点属性Js
    bindData(movedDom){
        $(".setArea").find(".areaIF").remove()//删除条件属性
        $("#paintArea").find("g").removeClass("checked")
        $("#paintArea").find("g").find("path").removeAttr("stroke-dasharray")
        //缓存节点dom
        let $nameInputDom= $(".setArea").find("input[id='flowName']")
        let flowDataRow=$(movedDom).attr("data-row")
        //添加chosed Class表示被选中
        $("#paintArea").find(".flowIcon,.tiaoJianIcon").removeClass("chosed")
        $(movedDom).addClass("chosed")

        //节点绑定到输入框
        let moveName=$(movedDom).attr("data-name")
        $nameInputDom.val(moveName)
        if(flowDataRow=="FLOWSTART"||flowDataRow=="FLOWEND"){
            $nameInputDom.attr("readonly",true)
            $nameInputDom.addClass("inputRead")
        }else{
            $nameInputDom.attr("readonly",false)
            $nameInputDom.removeClass("inputRead")
        }
         //输入框绑定到节点
        $nameInputDom.on("blur",function () {
            let $chosedFlow=$("#paintArea").find(".flowIcon.chosed,.tiaoJianIcon.chosed")
            let value=$nameInputDom.val()
            /*if(value=="开始"||value=="结束"){
                $nameInputDom.val("")
                $nameInputDom.focus()
                return
            }*/
            let formName=value.length>4?value.substring(0,4)+"...":value
            $chosedFlow.find("span").text(formName)
            $chosedFlow.attr("data-name",$nameInputDom.val())
        })
        //绑定流程属性
        let className=movedDom.className

        if(flowDataRow=="FLOWSTART"){
            $("#flowBelong").val("StartNoneEvent")
            $("#flowOption").val("开始节点")
        }
        if(flowDataRow=="FLOWEND"){
            $("#flowBelong").val("EndNoneEvent")
            $("#flowOption").val("结束节点")
        }
        if(flowDataRow!="FLOWSTART"&&flowDataRow!="FLOWEND"){
            $("#flowBelong").val(className.indexOf("flowIcon")>-1?"UserTask":"ExclusiveGateway")
            $("#flowOption").val(className.indexOf("flowIcon")>-1?"任务节点":"条件节点")
        }
    }
    saveFlow(){//保存流程
      $("#saveFlowBtn").click(function () {
          let editTime=new Date()
          let saveHtml={task:[],line:[]}
          $("#paintArea").find("div").each(function () {
              saveHtml.task.push(this.outerHTML)
          })
          $("#paintSvg").find("g").each(function () {
              let path=$(this).find("path")
              saveHtml.line.push({
                  "data-start":$(this).attr("data-start"),
                  "data-end":$(this).attr("data-end"),
                  "data-path":$(this).attr("data-path"),
                  "child":{
                      "d":path.attr("d"),
                      "fill":path.attr("fill"),
                      "stroke":path.attr("stroke"),
                      "stroke-width":path.attr("stroke-width"),
                      "marker-end":path.attr("marker-end"),
                      "data-if":path.attr("data-if"),
                  }
              })
          })
          console.log(saveHtml)
          let flowAllData={
             "modeltype": "model",
             "json_xml":{
                 "resourceId":sessionStorage.flowStartId,
                 "properties": {
                     "process_id": sessionStorage.flowStartKey,
                     "name": sessionStorage.flowStartName,
                     "documentation": "",
                     "process_author": "",
                     "process_version": "",
                     "process_namespace": "http://www.activiti.org/processdef",
                     "executionlisteners": "",
                     "eventlisteners": "",
                     "signaldefinitions": "",
                     "messagedefinitions": ""
                 },
                 "stencil": {
                     "id": "BPMNDiagram"
                 },
                 "childShapes":[],
                 "bounds": {
                     "lowerRight": {
                         "x": 1200,
                         "y": 1050
                     },
                     "upperLeft": {
                         "x": 0,
                         "y": 0
                     }
                 },
                 "stencilset": {
                     "url": "stencilsets/bpmn2.0/bpmn2.0.json",
                     "namespace": "http://b3mn.org/stencilset/bpmn2.0#"
                 },
                 "ssextensions": []
             },
             "name": sessionStorage.flowStartName,
             "key": sessionStorage.flowStartKey,
             "description":saveHtml,
             "newversion": "true",
             "comment": "",
             "modelId": sessionStorage.flowStartId,
             "lastUpdated": editTime
         }

          $("#paintArea").find("div").each(function () {
              let stencil=""
              let childIdArr=[]
              if($(this).attr("data-row")=="FLOWSTART"){
                  stencil="StartNoneEvent"
              }else if($(this).attr("data-row")=="FLOWEND"){
                  stencil="EndNoneEvent"
              }else{
                  if($(this).hasClass("flowIcon")){
                      stencil="UserTask"
                  }
                  if($(this).hasClass("tiaoJianIcon")){
                      stencil="ExclusiveGateway"
                  }
              }
              let id=$(this).attr("data-row")
              $("#paintArea").find("g").each(function () {
                  if(id==$(this).attr("data-path").split("-")[0]){
                      childIdArr.push({
                          resourceId:$(this).attr("data-path")
                      })
                  }
              })

              flowAllData.json_xml.childShapes.push({
                  "resourceId":id,
                  "properties": {
                      "overrideid": "",
                      "name": $(this).attr("data-name"),
                      "documentation": "",
                      "executionlisteners": "",
                      "initiator": "",
                      "formkeydefinition": "",
                      "formreference": "",
                      "formproperties": ""
                      },
                  "stencil": {
                      "id": stencil
                  },
                  "childShapes": [],
                  "outgoing":childIdArr,
                  "bounds": {
                      "lowerRight": {
                          "x": 120,
                          "y": 180
                      },
                      "upperLeft": {
                          "x": 90,
                          "y": 150
                      }
                  },
                  "dockers": []
              })
          })

          
          $("#paintArea").find("g").each(function () {
              let staticValue=$(this).attr("data-if")
              flowAllData.json_xml.childShapes.push(
                  {
                      "resourceId":$(this).attr("data-path"),
                      "stencil":{"id":"SequenceFlow"},
                      "properties": {
                          "overrideid": "",
                          "name": "",
                          "documentation": "",
                          "conditionsequenceflow": staticValue?staticValue:"",
                          "executionlisteners": "",
                          "defaultflow": "false"
                      },
                      "childShapes": [],
                      "outgoing": [
                          {
                              "resourceId": $(this).attr("data-path").split("-")[1]
                          }
                      ],
                      "bounds": {
                          "lowerRight": {
                              "x": 315.6749683165235,
                              "y": 160.98781194715332
                          },
                          "upperLeft": {
                              "x": 265.8914379334765,
                              "y": 157.06296930284668
                          }
                      },
                      "dockers": [
                          {
                              "x": 50,
                              "y": 40
                          },
                          {
                              "x": 20.5,
                              "y": 20.5
                          }
                      ],
                      "target": {
                          "resourceId": $(this).attr("data-path").split("-")[1]
                      }
                  }
              )
          })
          console.log(flowAllData)
          Vue.http.post('/api/model/editor',flowAllData).
          then(function (data) {
              console.log(data)
              if(data.status==200){
                  sessionStorage.isFirstEdit=false
              }
          }, function () {

          });
      })
    }
}

export default Activiti

