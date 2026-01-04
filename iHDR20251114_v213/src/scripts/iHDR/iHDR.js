#define TITLE "iHDR"
#define VERSION "2.1.3"

#feature-id    iHDR : Sketchpad > iHDR
#feature-icon  @script_icons_dir/iHDR.svg
#feature-info  This utility allows for the easy application of iteration-based HDR.< br />\
    <br />\
    This script is used for HDR-based image stretching.\
    <br />\
	Made by Mr. Sketchpad


#include <pjsr/ColorSpace.jsh>
#include <pjsr/DataType.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/NumericControl.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/UndoFlag.jsh>

// The script's parameters prototype.
function parametersPrototype()
{
   this.setDefaults = function()
   {
	  this.oldCheck = true;
	  this.presets = 1;
      this.iterations = 5;
	  this.intensity = 0.20;
	  this.maskStrength = 1.25;
	  this.preservation = 5;
	  this.layersPer = 1;
	  this.repetitions = 1;
	  this.showTemp = false;
	  this.layerNames = [];
   };

   this.setParameters = function()
   {
      Parameters.clear();
      Parameters.set( "iterations", this.iterations );
      Parameters.set( "intensity", this.intensity );
      Parameters.set( "maskStrength", this.maskStrength );
      Parameters.set( "preservation", this.preservation );
      Parameters.set( "layersPer", this.layersPer );
   };

   this.getParameters = function()
   {
      if ( Parameters.has( "iterations" ) )
         this.iterations = Parameters.getReal( "iterations" );
	  if ( Parameters.has( "intensity" ) )
         this.intensity = Parameters.getReal( "intensity" );
	  if ( Parameters.has( "maskStrength" ) )
         this.maskStrength = Parameters.getReal( "maskStrength" );
	  if ( Parameters.has( "preservation" ) )
         this.preservation = Parameters.getReal( "preservation" );
	  if ( Parameters.has( "layersPer" ) )
         this.layersPer = Parameters.getReal( "layersPer" );

   };
}

function Preset()
{
}
Preset.prototype.Low = 0;
Preset.prototype.Medium = 1;
Preset.prototype.High = 2;


var parameters = new parametersPrototype();
parameters.setDefaults();
parameters.getParameters();

// --------------------------------- UI functions below adapted from built-in PixInsight scripts developed by Vincent Paris, John Murphy, and Juan Conejero ------------------------------------------ //


// Returns a push button with given text and onClick function.
function pushButtonWithTextOnClick( parent, text_, onClick_ )
{
   let button = new PushButton( parent );
   button.text = text_;
   button.onClick = onClick_;
   return button;
}

function fieldLabel( parent, text, width )
{
   this.label = new Label( parent );
   this.label.text = text;
   this.label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   if ( width != undefined && width != null )
      this.label.setFixedWidth( width );
   return this.label;
}

function createSpinBox(parent, min, max, val, onUpdate, toolTip="") {
   this.spinBox = new SpinBox( parent );
   this.spinBox.minValue = min;
   this.spinBox.maxValue = max;
   this.spinBox.precision = 2;
   this.spinBox.toolTip = toolTip;
   this.spinBox.setFixedWidth( 65 );
   this.spinBox.value = val
   this.spinBox.onValueUpdated = onUpdate;
   return spinBox;
}

// The script's parameters dialog prototype.
function parametersDialogPrototype()
{
   this.__base__ = Dialog;
   this.__base__();
   
   //this.minWidth = 600;

   let labelMinWidth = 115;

   this.windowTitle = TITLE;
   
   this.titlePane = new Label( this );

   this.titlePane.frameStyle = FrameStyle_Box;
   this.titlePane.margin = 4;
   this.titlePane.wordWrapping = true;
   this.titlePane.useRichText = true;
   this.titlePane.text =
      "<p><b>" + TITLE + " Version " + VERSION + "</b> &mdash; " +
      "Multiscale iterative HDR. Use this script to preserve bright areas while bringing out fainter components of the image."
	  +"<p>Instructions:"
	  +"<br>1. Stretch the image such that its brightest areas are at the desired intensity."
	  +"<br>2. Select the appropriate preset and apply the script.</p>"
	  +"You may find that you need to run the script multiple times.</p>"
	  +"<p>Made by Uri Darom</p>";
		 
    
   // Target View
   this.targetView = new VerticalSizer;
   this.targetView.margin = 6;
   this.targetView.spacing = 4;

   this.viewList = new ViewList( this );
   this.viewList.getMainViews();
   if ( parameters.targetView && parameters.targetView.isView )
   {
      this.viewList.currentView = parameters.targetView;
   }
   else
      parameters.targetView = this.viewList.currentView;

   this.viewList.onViewSelected = ( view ) =>
   {
      parameters.targetView = view;
   };

   this.targetView.add( this.viewList );
   this.TargetGroup = new GroupBox( this );
   this.TargetGroup.title = "Target View";
   this.TargetGroup.sizer = this.targetView;
   

   // Parameter control
   this.parameterPane = new VerticalSizer;
   this.parameterPane.scaledMargin = 6;
   this.parameterPane.scaledSpacing = 10;
   this.parameterPane.margin = 5;

   this.iterationsControl = new NumericControl( this );
   this.iterationsControl.label.text = "Stretch Iterations:";
   this.iterationsControl.label.minWidth = labelMinWidth;
   this.iterationsControl.slider.setRange( 1, 14 );
   this.iterationsControl.slider.setScaledMinWidth( 300 );
   this.iterationsControl.setRange( 1, 14 );
   this.iterationsControl.setPrecision( 2 );
   this.iterationsControl.setValue( parameters.iterations );
   this.iterationsControl.sizer.addStretch();
   this.iterationsControl.toolTip =
      "<p>The number of HDR iterations.</p>";
   this.iterationsControl.onValueUpdated = function( value )
   {
      parameters.iterations = value;
   };
   
   /*
   this.layerControl = new NumericControl( this );
   this.layerControl.label.text = "Layers Per Iteration:";
   this.layerControl.label.minWidth = labelMinWidth;
   this.layerControl.slider.setRange( 1, 14 );
   this.layerControl.slider.setScaledMinWidth( 300 );
   this.layerControl.setRange( 1, 14 );
   this.layerControl.setPrecision( 0 );
   this.layerControl.setValue( parameters.layersPer );
   this.layerControl.toolTip =
      "<p>The number of layers masked per iteration.</p>";
   this.layerControl.onValueUpdated = function( value )
   {
      parameters.layersPer = value;
   };
	*/
   this.intensityControl = new NumericControl( this );
   this.intensityControl.label.text = "Stretch Intensity:";
   this.intensityControl.label.minWidth = labelMinWidth;
   this.intensityControl.slider.setRange( 0, 100 );
   this.intensityControl.slider.setScaledMinWidth( 300 );
   this.intensityControl.setRange( 0.0, 1.0 );
   this.intensityControl.setPrecision( 2 );
   this.intensityControl.setValue( parameters.intensity );
   this.intensityControl.sizer.addStretch();
   this.intensityControl.toolTip =
      "<p>The intensity of the stretch. A greater number results in a brighter stretch per iteration.</p>";
   this.intensityControl.onValueUpdated = function( value )
   {
      parameters.intensity = value;
   };
   
   this.maskStrengthControl = new NumericControl( this );
   this.maskStrengthControl.label.text = "Mask Strength:";
   this.maskStrengthControl.label.minWidth = labelMinWidth;
   this.maskStrengthControl.slider.setRange( 0, 40 );
   this.maskStrengthControl.slider.setScaledMinWidth( 300 );
   this.maskStrengthControl.setRange( 0.0, 4.0 );
   this.maskStrengthControl.setPrecision( 2 );
   this.maskStrengthControl.setValue( parameters.maskStrength );
   this.maskStrengthControl.sizer.addStretch();
   this.maskStrengthControl.toolTip =
      "<p>The strength of the masks. A greater value will protect the brighter areas of the image more.</p>";
   this.maskStrengthControl.onValueUpdated = function( value )
   {
      parameters.maskStrength = value;
   };
   
   this.preservationControl = new NumericControl( this );
   this.preservationControl.label.text = "Layer Preservation:";
   this.preservationControl.label.minWidth = labelMinWidth;
   this.preservationControl.slider.setRange( 0, 13 );
   this.preservationControl.slider.setScaledMinWidth( 300 );
   this.preservationControl.setRange( 0.0, 13.0 );
   this.preservationControl.setPrecision( 2 );
   this.preservationControl.setValue( parameters.preservation );
   this.preservationControl.sizer.addStretch();
   this.preservationControl.toolTip =
      "<p>Which layers are preserved in the stretch. Smaller values will protect smaller objects more, at the cost of some local contrast.</p>";
   this.preservationControl.onValueUpdated = function( value )
   {
      parameters.preservation = value;
   };
   
   var self = this;
   
   /*
   this.oldCheck = new CheckBox(this);
   this.oldCheck.text = "Use old behavior";
   this.oldCheck.toolTip = "<p>Not recommended. Reverts script behavior to that of the 1.0 version. "
                          +"This setting effectively reduces the effect of HDR on small objects. "
						  +"Checking this option may slightly reduce run time.</p>"
   this.oldCheck.checked = !parameters.oldCheck;
   this.oldCheck.onCheck = function (checked)
   {
      parameters.oldCheck = !checked;
   };
   */
   
   this.repeatLabel = fieldLabel( this, "Repetitions: ", 85);
   this.repeatSpinbox = createSpinBox(this, 1, 100000, parameters.repetitions, function (value) {parameters.repetitions = parseFloat(value);}, "The number of times the script will be repeated on the target image.");
   
   this.presetLabel = new Label(this);
   this.presetLabel.text = "Preset:";
   this.presetLabel.textAlignment = TextAlign_Left | TextAlign_VertCenter;
   this.presetCombo = new ComboBox(this);
   this.presetCombo.editEnabled = false;
   this.presetCombo.toolTip = "<p>Select the amount of HDR you desire, and the settings will be changed appropriately.</p>";
   this.presetCombo.addItem("Low HDR");
   this.presetCombo.addItem("Medium HDR");
   this.presetCombo.addItem("High HDR");
   this.presetCombo.currentItem = parameters.presets ? parameters.presets : 0;
   this.presetCombo.onItemSelected = function ()
   {
      parameters.presets = this.currentItem;
	  if (this.currentItem == Preset.prototype.Low) {
		parameters.repetitions = 1;
		parameters.iterations = 5;
		parameters.layersPer = 1;
		parameters.intensity = 0.17;
		parameters.maskStrength = 0.75;
		parameters.preservation = 4;
	  }
	  else if (this.currentItem == Preset.prototype.Medium) {
		parameters.repetitions = 1;
		parameters.iterations = 5;
		parameters.layersPer = 1;
		parameters.intensity = 0.20;
		parameters.maskStrength = 1.25;
		parameters.preservation = 5;
	  }
	  else if (this.currentItem == Preset.prototype.High) {
		parameters.repetitions = 1;
		parameters.iterations = 5;
		parameters.layersPer = 1;
		parameters.intensity = 0.23;
		parameters.maskStrength = 2.25;
		parameters.preservation = 6;
	  }
	  self.repeatSpinbox.value = parameters.repetitions;
	  self.iterationsControl.setValue(parameters.iterations);
	  //self.layerControl.setValue(parameters.layersPer);
	  self.intensityControl.setValue(parameters.intensity);
	  self.maskStrengthControl.setValue(parameters.maskStrength);
	  self.preservationControl.setValue(parameters.preservation);
   };
   
   this.presetSizer = new HorizontalSizer();
   this.presetSizer.scaledSpacing = 4;
   this.presetSizer.add(this.presetLabel);
   this.presetSizer.add(this.presetCombo);
   //this.presetSizer.addSpacing(50);
   this.presetSizer.add(this.repeatLabel);
   this.presetSizer.add(this.repeatSpinbox);
   //this.presetSizer.add(this.oldCheck);
   this.presetSizer.margin = 10;
   this.presetSizer.addStretch();
   
   this.optionGroup = new GroupBox( this );
   this.optionGroup.title = "Options";
   this.optionGroup.sizer = this.presetSizer;


   this.PrLiPane = new HorizontalSizer;
   this.PrLiPane.addUnscaledSpacing( labelMinWidth + this.logicalPixelsToPhysical( 4 ) );
   this.PrLiPane.addStretch();
   
   this.sliderSizer = new VerticalSizer();
   this.sliderSizer.scaledSpacing = 10;
   this.sliderSizer.margin = 15;
   this.sliderSizer.add( this.iterationsControl );
   //this.sliderSizer.add( this.layerControl );
   this.sliderSizer.add( this.intensityControl );
   this.sliderSizer.add( this.maskStrengthControl );
   this.sliderSizer.add( this.preservationControl );
   this.sliderSizer.addStretch();
   
   this.sliderGroup = new GroupBox( this );
   this.sliderGroup.title = "HDR Settings";
   this.sliderGroup.sizer = this.sliderSizer;

   this.parameterPane.add( this.optionGroup );
   this.parameterPane.add( this.sliderGroup );
   this.parameterPane.add( this.PrLiPane );

   this.buttonPane = new HorizontalSizer;
   this.buttonPane.spacing = 6;
   this.buttonPane.addStretch();
   this.ok_Button = new PushButton(this);
   this.ok_Button.text = "Execute";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function ()
   {
      this.dialog.ok();
   };
   this.buttonPane.add(this.ok_Button);
   
   this.cancel_Button = new PushButton(this);
   this.cancel_Button.text = "Close";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function ()
   {
      this.dialog.cancel();
   };
   this.buttonPane.add(this.cancel_Button);
   

   this.bottomBarPane = new HorizontalSizer;

   this.newInstanceButton = new ToolButton( this );
   this.newInstanceButton.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstanceButton.setScaledFixedSize( 24, 24 );
   this.newInstanceButton.toolTip = "New Instance";
   this.newInstanceButton.onMousePress = function()
   {
      this.hasFocus = true;
      this.pushed = false;
      parameters.setParameters();
      this.dialog.newInstance();
   };

   this.bottomBarPane.add( this.newInstanceButton );
   this.bottomBarPane.add( this.buttonPane );


   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add( this.titlePane );
   this.sizer.addSpacing(10);
   this.sizer.add( this.TargetGroup );
   this.sizer.add( this.parameterPane );
   this.sizer.add( this.bottomBarPane );

   this.adjustToContents();
   this.setFixedSize();
}

parametersDialogPrototype.prototype = new Dialog;

function mmt(layersDisabled, targetView, disable=true) {
	var P = new MultiscaleMedianTransform;
	var layers = [
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 1
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 2
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 4
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 8
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 16
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 32
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 64
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 128
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 256
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 512
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000]
	];
	for (let i = 0; i < 16; i++) {
	  if (i<layersDisabled) layers[i][0] = !disable;
	  else layers[i][0] = disable;
	}
	P.layers = layers;
    P.transform = MultiscaleMedianTransform.prototype.MultiscaleMedianTransform;
    P.executeOn(targetView, true );
}

function singleLayerMMT(targetView, layer, enabled = true) {
	var P = new MultiscaleMedianTransform;
	var layers = [
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 1
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 2
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 4
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 8
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 16
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 32
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 64
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 128
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 256
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],  // 512
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000],
		 [true, true, 0.000, false, 1.0000, 1.00, 0.0000]
	];
	if (enabled) {
		for (let i = 0; i<16; i++) {
			if (i!=layer-1) layers[i][0] = false;
		}
	}
	else layers[layer-1][0] = false;
	P.layers = layers;
    P.transform = MultiscaleMedianTransform.prototype.MultiscaleMedianTransform;
    P.executeOn(targetView, true );
}

function pixelMath(targetView, expression, createImage = false, imageId = "", grayscale = false, symbols =  "M, S="+(1-((parameters.intensity/2)+0.5))) {
	var P = new PixelMath;
	P.expression = expression
	P.useSingleExpression = true;
	P.symbols = symbols;
	P.singleThreaded = false;
	P.optimization = true;
	P.createNewImage = createImage;
	P.showNewImage = parameters.showTemp;
	P.newImageId = imageId;
	if (grayscale) P.newImageColorSpace = 2;
	else P.newImageColorSpace = PixelMath.prototype.SameAsTarget;
	P.newImageSampleFormat = PixelMath.prototype.SameAsTarget;
	P.executeOn(targetView, true );
}

function splitLayers(targetView, num, min = 0) {
	for (let i = 0; i<num; i++) {
		var name = getNewName(targetView.id+"_Layer"+i);
		pixelMath(targetView, "$T", true, name);
        var layer = View.viewById(name);
        singleLayerMMT(layer, i+min);
        parameters.layerNames[i] = name;		
	}
}

function getNewName(name)
{
   var newName = name;
   let n = 1;
   while (!ImageWindow.windowById(newName).isNull)
   {
      ++n;
      newName = name + n;
   }
   return newName;
}

function calibrateBlackPoint(targetView) {
	var name = getNewName("F");
	pixelMath(targetView, "iif(IsColor(), Avg($T[0], $T[1], $T[2]), $T)", true, name, true);
	var F = View.viewById(name);
	pixelMath(F, "min(max(0, med($T) + -2.8 * mdev($T)), 1)");
	pixelMath(targetView, "($T - "+name+") / (1- "+name+")");
	F.window.forceClose();
}

// The script's process prototype.
function processPrototype()
{
   var reps = 1;
   var self = this;
   this.execute = function()
   {
	  var targetName = getNewName("target");
	  pixelMath(parameters.targetView, "$T", true, targetName, false);
	  var target = View.viewById(targetName);

	  
	  calibrateBlackPoint(target);
	  
	  var runs = 0;
	  for (let i = 0; i < parameters.iterations*parameters.layersPer; i += parameters.layersPer) {
		console.noteln("Iteration ", (i/parameters.layersPer)+1+"/"+parameters.iterations);
		var tempName = getNewName("temp");
	    var maskName = getNewName("Mask");
		pixelMath(target, "$T", true, tempName, false);
		pixelMath(target, "iif(isColor(), Avg($T[0], $T[1], $T[2]), $T)", true, maskName, true);
		var mask = View.viewById(maskName);

		var layersToDisable = i+parameters.preservation;
		
		if (parameters.oldCheck) {
			
			 var grayTargetName = getNewName("grayTarget");
			 pixelMath(target, "iif(isColor(), Avg($T[0], $T[1], $T[2]), $T)", true, grayTargetName, true);
			 var grayTarget = View.viewById(grayTargetName);
			  
			 grayTarget.window.createPreview(0, parameters.targetView.window.width, 0, parameters.targetView.window.height);
			 var previews = grayTarget.window.previews;
			 var targetPreview = grayTarget.window.previews[grayTarget.window.previews.length-1];
			 
			 HT = new HistogramTransformation;
	         HT.H = [
				[0, 0.5, 1.0, 0.0, 1.0],
				[0, 0.5, 1.0, 0.0, 1.0],
				[0, 0.5, 1.0, 0.0, 1.0],
				[mask.image.median(), 0.5, 1.0, 0.0, 1.0],
			 ]
			
			for (let j = 0; j<i+2; j++) {
				console.writeln("Extracting Layer: ", j+1, "/", i+2);
				if (j==0) {
					mmt(parameters.preservation/2 + i, targetPreview);
				} else mmt((j-1)+parameters.preservation, targetPreview);
				var name = getNewName(target.id+"_Layer"+j);
				let window = new ImageWindow(grayTarget.window.width, grayTarget.window.height, grayTarget.image.numberOfChannels, 
											 grayTarget.image.bitsPerSample, grayTarget.image.isReal, grayTarget.image.isColor, name);
				window.mainView.beginProcess();
				window.mainView.image.assign( targetPreview.image );
				window.mainView.endProcess();
				if (parameters.showTemp) window.show();
				parameters.layerNames[j] = name;		
				pixelMath(targetPreview, parameters.layerNames[0]);
			}
			pixelMath(mask, parameters.layerNames[0]);
			
			for (let j = 1; j<parameters.layerNames.length; j++) {
				pixelMath(mask, "M = ~((~"+parameters.layerNames[j]+")^"+(j+i)+"); ($T*(~M))+(("+parameters.layerNames[j]+")*M)");
			}
			//HT.executeOn(mask, true);
			pixelMath(mask, "(~$T)^"+parameters.maskStrength);
			pixelMath(target, "(mtf(S, "+tempName+")*"+maskName+")+("+tempName+"*~"+maskName+")");
			
			for (let j = 0; j<parameters.layerNames.length; j++) {
				View.viewById(parameters.layerNames[j]).window.forceClose();
			}
			parameters.layerNames = [];
			grayTarget.window.forceClose();
			
		} else {
			HT = new HistogramTransformation;
	         HT.H = [
				[0, 0.5, 1.0, 0.0, 1.0],
				[0, 0.5, 1.0, 0.0, 1.0],
				[0, 0.5, 1.0, 0.0, 1.0],
				[mask.image.median(), 0.5, 1.0, 0.0, 1.0],
			 ]
			
			mmt(layersToDisable, mask);
			HT.executeOn(mask, true);
			pixelMath(mask, "(~$T)^"+parameters.maskStrength);
			pixelMath(target, "(mtf(S, "+tempName+")*"+maskName+")+(temp*~"+maskName+")");
		}
		
		View.viewById(maskName).window.forceClose();
		View.viewById(tempName).window.forceClose();

		runs++;
	  }
	  pixelMath(parameters.targetView, targetName, false, "", false);
	  View.viewById(targetName).window.forceClose();
	  if (reps < parameters.repetitions) {
		console.noteln("Repeating: ", reps+1, "/", parameters.repetitions);
		reps++;
	    self.execute();
	  }
   };
}

var process = new processPrototype();

function colorspaceIsValid( image )
{
   // Grayscale is not a valid colorspace for this script
   return true;
}

function performChecksAndExecute()
{

   // dumb idiot stupid way of determining if the target view is null, because just
   // checking explicitly doesn't work for some reason
   try {
	   pixelMath(parameters.targetView, "$T");
   }
   catch (error) {
     ( new MessageBox(
	   "<p>IHDR Error:<br><br>Undefined target view.</p>",
	   TITLE,
	   StdIcon_Warning,
	   StdButton_Ok ) ).execute();
      return;
   } 
   
   
   if ((parameters.iterations*parameters.layersPer)+parameters.preservation > 16) {
	   ( new MessageBox(
         "<p>IHDR Error:<br><br>Too many layers!</p>"+
		 "<p>Reduce the number of iterations or the layers preserved.</p>",
         TITLE,
         StdIcon_Warning,
         StdButton_Ok ) ).execute();
      return;
   }

   console.noteln( "Applying HDR: ", ImageWindow.activeWindow.currentView.id );
   process.execute();
}

function executeInGlobalContext()
{
   ( new MessageBox(
      "<p>IHDR Error:<br><br>This script cannot be executed on global context.</p>",
      TITLE,
      StdIcon_Error,
      StdButton_Ok ) ).execute();

}

function executeOnTargetView( view )
{
   parameters.targetView = view;
   parameters.getParameters();
   performChecksAndExecute();
}

function main()
{

   if ( Parameters.isGlobalTarget )
   {
      // Script has been launched in global context, execute and exit
      executeInGlobalContext();
      return;
   }
   if ( Parameters.isViewTarget )
   {
      // Script has been launched on a view target, execute and exit
      executeOnTargetView( Parameters.targetView );
      return;
   }


   parameters.targetView = ImageWindow.activeWindow.currentView;
   // Prepare the dialog
   let parametersDialog = new parametersDialogPrototype();

   // Runloop
   while ( true )
   {
      // Run the dalog
      if ( parametersDialog.execute() == 0 )
      {
         // Dialog closure forced
         return;
      }
      performChecksAndExecute();
   }
}

main();
