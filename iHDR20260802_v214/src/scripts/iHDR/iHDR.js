#engine v8

#define TITLE "iHDR"
#define VERSION "2.1.4"

#feature-id    iHDR : Sketchpad > iHDR
#feature-icon  @script_icons_dir/iHDR.svg
#feature-info  This utility allows for the easy application of iteration-based HDR.<br />\
    <br />\
    This script is used for HDR-based image stretching.\
    <br />\
	Made by Uri Darom

CoreApplication.ensureMinimumVersion( 1, 9, 4 );

// Preset identifiers, in the order of the preset combo box items.
const Preset = Object.freeze( { Low: 0, Medium: 1, High: 2 } );

// Parameter values applied by each preset, indexed by Preset.
const PRESETS = [
   { name: "Low HDR",    intensity: 0.17, maskStrength: 0.75, preservation: 4 },
   { name: "Medium HDR", intensity: 0.20, maskStrength: 1.25, preservation: 5 },
   { name: "High HDR",   intensity: 0.23, maskStrength: 2.25, preservation: 6 }
];

// The script's parameters, including persistence to and from process instances.
function parametersPrototype()
{
   this.setDefaults = function()
   {
      this.presets = Preset.Medium;
      this.iterations = 5;
      this.intensity = 0.20;
      this.maskStrength = 1.25;
      this.preservation = 5;
      this.layersPer = 1;
      this.repetitions = 1;
      this.showTemp = false;   // keep intermediate images open, for debugging
      this.layerNames = [];
   };

   // Stores the current parameters in a new process instance.
   this.setParameters = function()
   {
      Parameters.clear();
      Parameters.set( "iterations", this.iterations );
      Parameters.set( "intensity", this.intensity );
      Parameters.set( "maskStrength", this.maskStrength );
      Parameters.set( "preservation", this.preservation );
      Parameters.set( "layersPer", this.layersPer );
   };

   // Restores the parameters defined by the process instance being executed.
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

var parameters = new parametersPrototype();
parameters.setDefaults();
parameters.getParameters();

// The user interface below is adapted from built-in PixInsight scripts
// developed by Vincent Paris, John Murphy and Juan Conejero.

function fieldLabel( parent, text, width )
{
   let label = new Label( parent );
   label.text = text;
   label.textAlignment = TextAlignment.Right | TextAlignment.VertCenter;
   if ( width != undefined && width != null )
      label.setFixedWidth( width );
   return label;
}

function createSpinBox( parent, min, max, val, onUpdate, toolTip = "" )
{
   let spinBox = new SpinBox( parent );
   spinBox.minValue = min;
   spinBox.maxValue = max;
   spinBox.precision = 2;
   spinBox.toolTip = toolTip;
   spinBox.setFixedWidth( 65 );
   spinBox.value = val;
   spinBox.onValueUpdated = onUpdate;
   return spinBox;
}

// The script's parameters dialog.
var ParametersDialog = class extends Dialog
{
   constructor()
   {
      super();

      let labelMinWidth = 115;

      this.windowTitle = TITLE;

      this.titlePane = new Label( this );
      this.titlePane.frameStyle = FrameStyle.Box;
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

      // Target view
      this.targetView = new VerticalSizer;
      this.targetView.margin = 6;
      this.targetView.spacing = 4;

      this.viewList = new ViewList( this );
      this.viewList.getMainViews();
      if ( parameters.targetView && !parameters.targetView.isNull )
         this.viewList.currentView = parameters.targetView;
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

      // Parameter controls
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

      // Preset selection and repetition count
      this.repeatLabel = fieldLabel( this, "Repetitions: ", 85 );
      this.repeatSpinbox = createSpinBox( this, 1, 100000, parameters.repetitions,
                                          function( value ) { parameters.repetitions = parseFloat( value ); },
                                          "The number of times the script will be repeated on the target image." );

      this.presetLabel = new Label( this );
      this.presetLabel.text = "Preset:";
      this.presetLabel.textAlignment = TextAlignment.Left | TextAlignment.VertCenter;

      this.presetCombo = new ComboBox( this );
      this.presetCombo.editEnabled = false;
      this.presetCombo.toolTip = "<p>Select the amount of HDR you desire, and the settings will be changed appropriately.</p>";
      for ( let preset of PRESETS )
         this.presetCombo.addItem( preset.name );
      this.presetCombo.currentItem = parameters.presets;
      this.presetCombo.onItemSelected = () =>
      {
         parameters.presets = this.presetCombo.currentItem;
         let preset = PRESETS[parameters.presets];
         parameters.repetitions = 1;
         parameters.iterations = 5;
         parameters.layersPer = 1;
         parameters.intensity = preset.intensity;
         parameters.maskStrength = preset.maskStrength;
         parameters.preservation = preset.preservation;

         this.repeatSpinbox.value = parameters.repetitions;
         this.iterationsControl.setValue( parameters.iterations );
         this.intensityControl.setValue( parameters.intensity );
         this.maskStrengthControl.setValue( parameters.maskStrength );
         this.preservationControl.setValue( parameters.preservation );
      };

      this.presetSizer = new HorizontalSizer();
      this.presetSizer.scaledSpacing = 4;
      this.presetSizer.add( this.presetLabel );
      this.presetSizer.add( this.presetCombo );
      this.presetSizer.add( this.repeatLabel );
      this.presetSizer.add( this.repeatSpinbox );
      this.presetSizer.margin = 10;
      this.presetSizer.addStretch();

      this.optionGroup = new GroupBox( this );
      this.optionGroup.title = "Options";
      this.optionGroup.sizer = this.presetSizer;

      // Reserves the width of the parameter labels, keeping the panes aligned.
      this.PrLiPane = new HorizontalSizer;
      this.PrLiPane.addUnscaledSpacing( labelMinWidth + this.logicalPixelsToPhysical( 4 ) );
      this.PrLiPane.addStretch();

      this.sliderSizer = new VerticalSizer();
      this.sliderSizer.scaledSpacing = 10;
      this.sliderSizer.margin = 15;
      this.sliderSizer.add( this.iterationsControl );
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

      // Dialog buttons
      this.buttonPane = new HorizontalSizer;
      this.buttonPane.spacing = 6;
      this.buttonPane.addStretch();

      this.ok_Button = new PushButton( this );
      this.ok_Button.text = "Execute";
      this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
      this.ok_Button.onClick = () =>
      {
         this.ok();
      };
      this.buttonPane.add( this.ok_Button );

      this.cancel_Button = new PushButton( this );
      this.cancel_Button.text = "Close";
      this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
      this.cancel_Button.onClick = () =>
      {
         this.cancel();
      };
      this.buttonPane.add( this.cancel_Button );

      this.bottomBarPane = new HorizontalSizer;

      // Saves the current parameters as a new process instance.
      this.newInstanceButton = new ToolButton( this );
      this.newInstanceButton.icon = this.scaledResource( ":/process-interface/new-instance.png" );
      this.newInstanceButton.setScaledFixedSize( 24, 24 );
      this.newInstanceButton.toolTip = "New Instance";
      this.newInstanceButton.onMousePress = () =>
      {
         this.newInstanceButton.hasFocus = true;
         this.newInstanceButton.pushed = false;
         parameters.setParameters();
         this.newInstance();
      };

      this.bottomBarPane.add( this.newInstanceButton );
      this.bottomBarPane.add( this.buttonPane );

      this.sizer = new VerticalSizer;
      this.sizer.margin = 6;
      this.sizer.spacing = 6;
      this.sizer.add( this.titlePane );
      this.sizer.addSpacing( 10 );
      this.sizer.add( this.TargetGroup );
      this.sizer.add( this.parameterPane );
      this.sizer.add( this.bottomBarPane );

      this.adjustToContents();
      this.setFixedSize();
   }
};

// Applies a multiscale median transform to targetView with the first
// layersDisabled dyadic layers removed, smoothing all structures below that
// scale.
function mmt( layersDisabled, targetView )
{
   let layers = [];
   for ( let i = 0; i < 16; ++i )
      // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold,
      // noiseReductionAmount, noiseReductionAdaptive
      layers.push( [i >= layersDisabled, true, 0.000, false, 1.0000, 1.00, 0.0000] );

   let P = new MultiscaleMedianTransform;
   P.layers = layers;
   P.transform = MultiscaleMedianTransform.MultiscaleMedianTransform;
   P.executeOn( targetView, true );
}

// Evaluates a PixelMath expression on targetView. Returns the newly created
// image when createImage is true, or null otherwise.
function pixelMath( targetView, expression, createImage = false, imageId = "", grayscale = false,
                    symbols = "M, S=" + (1-((parameters.intensity/2)+0.5)) )
{
   let P = new PixelMath;
   P.expression = expression;
   P.useSingleExpression = true;
   P.symbols = symbols;
   P.singleThreaded = false;
   P.optimization = true;
   P.createNewImage = createImage;
   P.showNewImage = parameters.showTemp;
   P.newImageId = imageId;
   P.newImageColorSpace = grayscale ? 2 : PixelMath.SameAsTarget;
   P.newImageSampleFormat = PixelMath.SameAsTarget;
   P.executeOn( targetView, true );

   if ( !createImage )
      return null;
   let view = View.viewById( imageId );
   if ( view === null || view.isNull )
      throw new Error( "iHDR: failed to create image " + imageId );
   return view;
}

// Returns an image identifier derived from name that is not already in use.
function getNewName( name )
{
   let newName = name;
   let n = 1;
   for ( ;; )
   {
      let window = ImageWindow.windowById( newName );
      if ( window === null || window.isNull )
         return newName;
      ++n;
      newName = name + n;
   }
}

// Closes the image window holding the specified view, if it still exists.
function closeView( id )
{
   let view = View.viewById( id );
   if ( view !== null && !view.isNull )
      view.window.forceClose();
}

// Subtracts a robust estimate of the background level, taken from the median
// and MAD of the luminance, and rescales the result to [0,1].
function calibrateBlackPoint( targetView )
{
   let name = getNewName( "F" );
   let F = pixelMath( targetView, "iif(IsColor(), Avg($T[0], $T[1], $T[2]), $T)", true, name, true );
   pixelMath( F, "min(max(0, med($T) + -2.8 * mdev($T)), 1)" );
   pixelMath( targetView, "($T - " + name + ") / (1- " + name + ")" );
   F.window.forceClose();
}

// The script's process.
function processPrototype()
{
   // Applies one full pass of the iterative HDR stretch to the target view.
   function runOnce()
   {
      // Work on a copy, so the target view is modified only once, at the end.
      let targetName = getNewName( "target" );
      let target = pixelMath( parameters.targetView, "$T", true, targetName, false );

      calibrateBlackPoint( target );

      for ( let i = 0; i < parameters.iterations*parameters.layersPer; i += parameters.layersPer )
      {
         console.noteln( "Iteration ", (i/parameters.layersPer)+1 + "/" + parameters.iterations );

         let tempName = getNewName( "temp" );
         let maskName = getNewName( "Mask" );
         pixelMath( target, "$T", true, tempName, false );
         let mask = pixelMath( target, "iif(isColor(), Avg($T[0], $T[1], $T[2]), $T)", true, maskName, true );

         // The detail layers are extracted through a preview, which the
         // multiscale transform can consume without destroying the source.
         let grayTargetName = getNewName( "grayTarget" );
         let grayTarget = pixelMath( target, "iif(isColor(), Avg($T[0], $T[1], $T[2]), $T)", true, grayTargetName, true );
         let targetPreview = grayTarget.window.createPreview( grayTarget.image.bounds, "layers" );

         for ( let j = 0; j < i+2; ++j )
         {
            console.writeln( "Extracting Layer: ", j+1, "/", i+2 );
            mmt( (j == 0) ? parameters.preservation/2 + i : (j-1) + parameters.preservation, targetPreview );

            let name = getNewName( target.id + "_Layer" + j );
            let window = new ImageWindow( grayTarget.image.width, grayTarget.image.height,
                                          grayTarget.image.numberOfChannels, grayTarget.image.bitsPerSample,
                                          grayTarget.image.isReal, grayTarget.image.isColor, name );
            window.mainView.beginProcess();
            window.mainView.image.assign( targetPreview.image );
            window.mainView.endProcess();
            if ( parameters.showTemp )
               window.show();
            parameters.layerNames[j] = name;

            // Reset the preview to the coarsest layer before the next pass.
            pixelMath( targetPreview, parameters.layerNames[0] );
         }

         // Accumulate the extracted layers into the mask, weighting each one by
         // its scale, then shape the result with the mask strength exponent.
         pixelMath( mask, parameters.layerNames[0] );
         for ( let j = 1; j < parameters.layerNames.length; ++j )
            pixelMath( mask, "M = ~((~" + parameters.layerNames[j] + ")^" + (j+i) + "); "
                           + "($T*(~M))+((" + parameters.layerNames[j] + ")*M)" );
         pixelMath( mask, "(~$T)^" + parameters.maskStrength );

         // Blend the stretched and unstretched copies through the mask.
         pixelMath( target, "(mtf(S, " + tempName + ")*" + maskName + ")+(" + tempName + "*~" + maskName + ")" );

         for ( let j = 0; j < parameters.layerNames.length; ++j )
            closeView( parameters.layerNames[j] );
         parameters.layerNames = [];

         grayTarget.window.forceClose();
         closeView( maskName );
         closeView( tempName );
      }

      pixelMath( parameters.targetView, targetName, false, "", false );
      closeView( targetName );
   }

   this.execute = function()
   {
      for ( let rep = 1; rep <= parameters.repetitions; ++rep )
      {
         if ( rep > 1 )
            console.noteln( "Repeating: ", rep, "/", parameters.repetitions );
         runOnce();
      }
   };
}

var process = new processPrototype();

function performChecksAndExecute()
{
   if ( !parameters.targetView || parameters.targetView.isNull )
   {
      ( new MessageBox(
         "<p>iHDR Error:<br><br>Undefined target view.</p>",
         TITLE,
         StdIcon.Warning,
         StdButton.Ok ) ).execute();
      return;
   }

   // Each iteration consumes one dyadic layer on top of those preserved, and
   // the multiscale transform provides sixteen.
   if ( (parameters.iterations*parameters.layersPer) + parameters.preservation > 16 )
   {
      ( new MessageBox(
         "<p>iHDR Error:<br><br>Too many layers!</p>"+
         "<p>Reduce the number of iterations or the layers preserved.</p>",
         TITLE,
         StdIcon.Warning,
         StdButton.Ok ) ).execute();
      return;
   }

   console.noteln( "Applying HDR: ", parameters.targetView.id );
   process.execute();
}

function executeInGlobalContext()
{
   ( new MessageBox(
      "<p>iHDR Error:<br><br>This script cannot be executed on global context.</p>",
      TITLE,
      StdIcon.Error,
      StdButton.Ok ) ).execute();
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

   let activeWindow = ImageWindow.activeWindow;
   parameters.targetView = ( activeWindow !== null && !activeWindow.isNull ) ? activeWindow.currentView : null;

   // Prepare the dialog
   let parametersDialog = new ParametersDialog();

   // Runloop
   while ( true )
   {
      // Run the dialog
      if ( parametersDialog.execute() == 0 )
      {
         // Dialog closure forced
         return;
      }
      performChecksAndExecute();
   }
}

main();
