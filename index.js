module.exports = function(elementUtil){
	return {
		name: 'my-viewphoto',
		prop: {
			template: `<div class="img-wrap pr" v-loading.lock="imgLoading" :style="{height: dialogHeight - 57 + 'px'}">
						<img 
							class="img-target ps" 
							alt="图片加载中…"
							draggable="false"
							ondragstart="return false"
							:src="photoSrc + aliImgUrl"
							:style="{
								left: imgLeft + 'px',top: imgTop + 'px',
								width:byHeight ? 'auto' : imgTargetWidth + 'px',
								height: byHeight ? imgTargetHeight + 'px' : 'auto'}"
							@mousedown="mousedown($event)"
							@mousemove="mouseMoveEvt($event)"
					    @mouseup="clearDrag($event)"
					    @mousewheel="mouseWheelEvt($event)"
					    @DOMMouseScroll="ffWheelEvt($event)"
					    @load="imgLoaded"
						>	
						<img
						class="img-ori" 
						:src="photoSrc + aliImgUrl"
						alt="">
						<div> 
							<span class="ps zoom-big-btn iconfont icon-fangda" @click="zoomChange(scaleChange)"></span>
						</div>
						
						<div>
							<span class="ps zoom-small-btn iconfont icon-minus" @click="zoomChange(-scaleChange)"></span>
						</div>
						<span class="recover-img-btn ps" @click="recoverImgSize">原始尺寸</span>
						<em :class="scaleClass" class="scale-display ps">当前缩放比例 {{Math.round(scaleTimes*100)}}%</em>
					</div>`,
		props:{
			photoSrc: {
				type: String,
				default: ''
			},
			isDialogTransform: {
				type: Boolean,
				default: false
			},
			dialogHeight: {
				type: Number,
				default:500
			},
			dialogWidth: {
				type: Number,
				default:500
			},
			dialogTop: {
				type: Number,
				default: 500,
			},
			dialogLeft: {
				type: Number,
				default: 500,
			},
			showImg: {
				type: Boolean,
				default: false,
			}
				
		},
		data(){
			return {
        WHEEL_SPEED: 0.0002,
				maxScale: 2,
				minScale: 0.03,
				imgLeft: 800,
				imgTop: 800,
				scaleTimes: 1,
				scaleChange: 0.05,

				disX: 0,
				disY: 0,
				draging: false,

				scaleLockX:false,
				scaleLockY:false,

				imgTargetWidth: 1000,
				imgTargetHeight: 1000,
        fixedHeight: 0,
        fixedWidth:0,
				imgTarget: null,
				imgWrap:null,

				byHeight: false,
				imgLoading: false,
				
				aliImgUrl: '',
				scaleClass: '',
			}
		},
		mounted(){
      this.imgLoading = true
      this.init()
		},
		methods:{
      init() {
        this.imgTarget = document.getElementsByClassName("img-target")[0]
        this.imgOri = document.getElementsByClassName("img-ori")[0]
        this.imgWrap = document.getElementsByClassName("img-wrap")[0]

        this.judgeUserAgent()
      },
      judgeUserAgent(){
        var ua = navigator.userAgent.toLowerCase()
        if (ua.includes('firefox')) {
          this.aliImgUrl = '?x-oss-process=image/resize,w_2000'
        } else {
          this.aliImgUrl = '?x-oss-process=image/auto-orient,1'
        }
      },
      imgLoaded(){
        this.setFixedSize()
        this.setImageTopLeft()
        this.byHeight = this.getByHeightState()
        this.zoomToBest()
        
        this.minScale = this.scaleTimes  // init min scale, this scale can show comfort
        this.setImgCenter()
        this.imgLoading = false
      },
      setFixedSize() {
        this.fixedHeight = this.imgOri.clientHeight
        this.fixedWidth = this.imgOri.clientWidth
      },
      setImageTopLeft() {
        this.imgTop = (this.imgWrap.clientHeight - this.imgTarget.clientHeight) / 2
        this.imgLeft = (this.imgWrap.clientWidth - this.imgTarget.clientWidth) / 2
      },
      getByHeightState() {
        var byHeight = false,
            wrapRate = this.imgWrap.clientWidth / this.imgWrap.clientHeight,
            imgRate = this.imgTarget.clientWidth / this.imgTarget.clientHeight

        if (wrapRate < imgRate) {
          byHeight = false

        } else {
          byHeight = true
        }
        return byHeight
      },
      zoomToBest() {
        var count = 0
        this.setImageSize()
        if (this.byHeight) {
          while ( this.imgWrap.clientHeight <= this.imgTargetHeight && count < 1000){
            this.zoomByHeight()
            count ++
          }
        } else {
          while ( this.imgWrap.clientHeight <= this.imgTargetWidth && count < 1000){
            this.zoomByWidth()
            count ++
          }
        }
      },
      zoomByWidth(){
        // 0.01 值越小更能精准的缩放到最佳显示
        this.imgTargetWidth = this.fixedWidth * (this.scaleTimes - 0.01)
        this.scaleTimes -= 0.01
      },
      zoomByHeight(){
        this.imgTargetHeight = this.fixedHeight * (this.scaleTimes - 0.01)
        this.scaleTimes -= 0.01
      },
      setImgCenter(){
        this.$nextTick(() => {
          this.imgTop = (this.imgWrap.clientHeight - this.imgTarget.clientHeight) / 2
          this.imgLeft = (this.imgWrap.clientWidth - this.imgTarget.clientWidth) / 2
        })
      },
      inWrap(oldValue, curValue, wrapValue) {
        var move = false
        if (wrapValue >= curValue || (oldValue < wrapValue && curValue >= wrapValue)) {
          move = true
        }

        return move
      },
			imgFillWrap(wrapWidth, wrapHeight, imgWidth, imgHeight, left, top){
        if (imgWidth <= wrapWidth) {
          this.imgLeft = (wrapWidth - imgWidth)/2

        } else if (left > 0) {
          this.imgLeft = 0
        
        } else if (imgWidth - wrapWidth < -left) {
          this.imgLeft = -(imgWidth - wrapWidth)
        
        } else {
          this.imgLeft =  left
        }

        if (imgHeight <= wrapHeight) {
          this.imgTop = (wrapHeight - imgHeight)/2
        
        } else if (top > 0) {
          this.imgTop = 0
        
        } else if (imgHeight - wrapHeight < -top) {
          this.imgTop = -(imgHeight - wrapHeight)
        
        } else {
          this.imgTop = top
        }
			},
      mouseWheelEvt(event) {
        event.preventDefault()
        var delta = event.wheelDelta * this.WHEEL_SPEED

        this.setWheelScale(event, delta)
      },
      ffWheelEvt(event){
        event.preventDefault()
        var delta = -event.detail / 3 * 120;
        delta = delta * this.WHEEL_SPEED

        this.setWheelScale(event, delta)
      },
      canZoom(delta) {
        var canZoomIn = delta > 0 && this.scaleTimes <= this.maxScale
        var canZoomOut = delta < 0 && this.scaleTimes >= this.minScale
        
        return  canZoomIn || canZoomOut
      },
      setWheelScale(event, delta){
        if (this.canZoom(delta)) {
          var oldLeft = this.imgLeft,
              oldTop = this.imgTop,
              oldScale = this.scaleTimes,
              oldImgWidth = this.imgTarget.clientWidth,
              oldImgHeight = this.imgTarget.clientHeight
          
          this.plusScales(delta)

          if (this.scaleTimes === this.minScale) {
            this.setImgCenter()
          
          } else {
            var centerX = event.clientX - this.dialogLeft,  
                centerY = event.clientY - this.dialogTop - 52,  // vertical offset for dialog title height
                position = this.getCenterPosition(oldLeft, oldTop, oldScale, centerX, centerY)
            
            this.fitToCenter(oldImgWidth, oldImgHeight, position.left, position.top)
          }
        }
        this.showScaleTip()
      },
      plusScales(delta) {
        this.scaleTimes += delta
        
        this.scaleTimes = this.scaleTimes < this.minScale ? this.minScale : this.scaleTimes
        this.scaleTimes = this.scaleTimes > this.maxScale ? this.maxScale : this.scaleTimes
        this.setImageSize()
      },
      fitToCenter(oldImgWidth, oldImgHeight, left, top) {
        this.$nextTick(()=> {
          var wrapWidth = this.imgWrap.clientWidth,
              wrapHeight = this.imgWrap.clientHeight,
              curImgWidth = this.imgTarget.clientWidth,
              curImgHeight = this.imgTarget.clientHeight

          if (this.inWrap(oldImgWidth, curImgWidth, wrapWidth) || this.inWrap(oldImgHeight, curImgHeight, wrapHeight)) {
            this.setImgCenter()
          
          } else {
            this.imgFillWrap(wrapWidth, wrapHeight, curImgWidth, curImgHeight, left, top)
          }
        })
      },
      getCenterPosition(oldLeft, oldTop, oldScale, centerX, centerY) {
        // center/scale = center2/scale2
        // center = center[0] - left
        var left = centerX - this.scaleTimes * (centerX - oldLeft) / oldScale
        var top = centerY - this.scaleTimes * (centerY - oldTop) / oldScale 

        return {left, top}
      },
			showScaleTip(){
				clearTimeout(this.showPopTimer) 
				this.scaleClass = 'transimg-pop-animation-in'
				this.showPopTimer = setTimeout(() => {
					this.scaleClass = 'transimg-pop-animation-out'
				},1500)
			},
      zoomChange(changed=0) {
        var oldLeft = this.imgLeft,
            oldTop = this.imgTop,
            oldScale = this.scaleTimes,
            oldImgWidth = this.imgTarget.clientWidth,
            oldImgHeight = this.imgTarget.clientHeight,
            wrapWidth = this.imgWrap.clientWidth,
            wrapHeight = this.imgWrap.clientHeight

        this.plusScales(changed)

        if (this.scaleTimes === this.minScale) {
          this.setImgCenter()

        } else {
          var centerX = wrapWidth / 2,
              centerY = wrapHeight / 2,
              position = this.getCenterPosition(oldLeft, oldTop, oldScale, centerX, centerY)

          this.fitToCenter(oldImgWidth, oldImgHeight, position.left, position.top)
        }
        this.showScaleTip()
      },
			recoverImgSize(){
        this.scaleTimes = 1
				this.zoomChange()
			},
			mousedown(event){
        event = event || window.event; 
        this.disX = event.clientX
        this.disY = event.clientY
        this.draging = true
      },
      mouseMoveEvt(event) {
       	var event = event || window.event
        if (this.draging) {
      		this.getScaleLockStatus()
	        if (this.scaleLockX && !this.scaleLockY) {
	          this.moveHorizontal(event)

	        } else if (this.scaleLockY && !this.scaleLockX) {
	          this.moveVertical(event)

	        } else if (this.scaleLockX && this.scaleLockY) {
	        	this.moveFree(event)

	        } else {
	        	return
	        }
      	}
      },
      moveHorizontal(event){
      	var moveLeft = event.clientX - this.disX;  

	      this.imgLeft += moveLeft
        this.disX = event.clientX
				this.judgeDragBoundaryHorizontal()
      },
      moveVertical(event){
      	var moveTop = event.clientY - this.disY;

        this.imgTop += moveTop
        this.disY = event.clientY
				this.judgeDragBoundaryVertical()
      },
      moveFree(event){
      	var moveLeft = event.clientX - this.disX
        var moveTop = event.clientY - this.disY
  
        this.imgLeft += moveLeft
        this.imgTop += moveTop 
        this.disX = event.clientX
        this.disY = event.clientY
				this.judgeDragBoundaryVertical()
				this.judgeDragBoundaryHorizontal()
      },
      judgeDragBoundaryHorizontal(){
    		if (this.imgLeft > 0) {
      		this.imgLeft = 0
      	
        } else if (this.imgLeft < this.imgWrap.clientWidth - this.imgTarget.clientWidth) {
	      	this.imgLeft = this.imgWrap.clientWidth - this.imgTarget.clientWidth
	      }

	      if (this.imgWrap.clientWidth > this.imgTarget.clientWidth) {
	      	this.setImgCenter()
	      } 
      },
      judgeDragBoundaryVertical(){
      	if (this.imgTop > 0) {
      		this.imgTop = 0
	     	
        } else if (this.imgTop < this.imgWrap.clientHeight - this.imgTarget.clientHeight) {
	     		this.imgTop = this.imgWrap.clientHeight - this.imgTarget.clientHeight
	     	}

	     	if (this.imgWrap.clientHeight > this.imgTarget.clientHeight) {
	      	this.setImgCenter()
	      }
      },
      clearDrag() {
        this.draging = false
      },
      getScaleLockStatus(){
      	var imgWrapHeight = this.imgWrap.clientHeight
      	var imgWrapWidth = this.imgWrap.clientWidth
      	
      	setTimeout(() => {
      		var imgWidth = this.imgTarget.clientWidth
      		var imgHeight = this.imgTarget.clientHeight

      		if (imgWidth <= imgWrapWidth && imgHeight >= imgWrapHeight) {
	      		this.scaleLockX = false
	      		this.scaleLockY = true
	      	} else if (imgWidth >= imgWrapWidth && imgHeight <= imgWrapHeight){
	      		this.scaleLockX = true
	      		this.scaleLockY = false
	      	} else if (imgWidth >= imgWrapWidth && imgHeight >= imgWrapHeight){
	      		this.scaleLockX = true
	      		this.scaleLockY = true
	      	} else{
	      		this.scaleLockX = false
	      		this.scaleLockY = false
	      	}

      	})
      },
      setImageSize() {
        if (this.byHeight) {
          this.imgTargetHeight = this.fixedHeight * this.scaleTimes

        } else{
          this.imgTargetWidth = this.fixedWidth * this.scaleTimes
        }
      },
	    changeLoadOpacity(color) {
      	setTimeout(()=> {
	        var dom = document.getElementsByClassName('el-loading-mask')
	        elementUtil.setDomStyle(dom, 'backgroundColor', color)
	      })
	    },
      stopZoomOut() {
        if (this.imgTargetWidth < this.imgWrap.clientWidth) {
          this.imgLeft = (this.imgWrap.clientWidth - this.imgTargetWidth)/2
        }
        if (this.imgTargetHeight < this.imgWrap.clientHeight) {
          this.imgLeft = (this.imgWrap.clientHeight - this.imgTargetHeight)/2
        }

        if (this.imgTargetHeight && this.imgTargetHeight < this.fixedHeight * this.minScale) {
          this.imgTargetHeight = this.fixedHeight * this.minScale
          this.setImgCenter()
        }
        if (this.imgTargetWidth && this.imgTargetWidth < this.fixedWidth * this.minScale) {
          this.imgTargetWidth = this.fixedWidth * this.minScale
          this.setImgCenter()
        }
      }
		},
		watch:{
			isDialogTransform(transform){
				if (transform) {
          this.$nextTick(()=> {
            if (this.imgTargetHeight <= this.dialogHeight - 57 || this.imgTargetWidth <= this.dialogWidth) {
              this.setImgCenter();
            }
            
            this.$emit('initTransform', false);
          })
				}
			},
			dialogHeight(height, lastHeight){
        var zoomIn = height - lastHeight < 0
				if (this.imgTargetHeight > height) {  // 图片较大时不触发 zoom 和 setCenter 
          return
        } else if (zoomIn && this.imgTargetHeight < height - 57) {  // 缩小并且图片不可再缩小时 不触发 zoom 和 setCenter, 140 表示 title 加上下边距 
          return
        } else {
          this.imgTargetHeight = height - 57
          this.scaleTimes = this.imgTargetHeight / this.fixedHeight
        }
			},
			dialogWidth(width, lastWidth){
        var zoomIn = width - lastWidth < 0
        if (this.imgTargetWidth > width) {
          return
        } else if (zoomIn && this.imgTargetWidth < width) {
          return
        } else {
          this.imgTargetWidth = width
          this.scaleTimes = this.imgTargetWidth / this.fixedWidth
        }
			},
			imgTargetHeight(height){
				this.stopZoomOut()
			},
			imgTargetWidth(width){
				this.stopZoomOut()
			},
			imgLoading(show){
				if (show) {
					this.changeLoadOpacity("rgba(255,255,255,1)")
				} else {
					this.changeLoadOpacity("rgba(255,255,255,0.9)")
				}
			}	

		}
		}
	}
}