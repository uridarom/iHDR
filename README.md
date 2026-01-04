# iHDR

<p>One of the most difficult targets to process in astrophotography are ones with extremely large differences in brightness. These can include galaxies with very faint halos, or nebulae with very bright cores, such as the Orion Nebula; in all of these examples, the target includes both a very bright inner “core” area, and a faint outer “halo” area. The challenge is to display both of these components in the final image such that neither is too dark nor too bright, while still maintaining a natural looking result.</p>

<img width="1480" height="1170" alt="image" src="https://github.com/user-attachments/assets/2cb62317-e3a9-4046-b28a-fce594b394af" />

<p>I created iHDR (iterative High Dynamic Range) in an attempt to solve this issue. The program uses multiscale image masks across multiple iterations in order to protect the bright areas of the image from being over-stretched, while still revealing the faint structure that would otherwise be lost in a standard stretch.</p>

<p>This offers several advantages compared to traditional HDR workflows, including a natural light falloff gradient from the bright to the faint parts of the image, and a preservation of local contrast for both small and large image features.</p>

# Installation

<p>The iHDR script is available for installation in PixInsight. To install the script in PixInsight, follow the instructions below:</p>


<p><br />      1. In PixInsight, go to <code class="language-plaintext highlighter-rouge">Resources</code>–&gt; <code class="language-plaintext highlighter-rouge">Updates</code> –&gt; <code class="language-plaintext highlighter-rouge">Manage Repositories</code>
<br />      2. Click the “Add” button on the bottom left of the popup
<br />      3. Enter the repository <code class="language-plaintext highlighter-rouge">https://uridarom.com/pixinsight/scripts/iHDR/</code> and click “OK”
<br />      4. Close the window and click on <code class="language-plaintext highlighter-rouge">Resources</code> –&gt; <code class="language-plaintext highlighter-rouge">Updates</code> –&gt; <code class="language-plaintext highlighter-rouge">Check For Updates</code>
<br />      5. Click “Apply” on the bottom right of the popup and restart PixInsight
<br />      6.  The script should appear under <code class="language-plaintext highlighter-rouge">Scripts</code> –&gt; <code class="language-plaintext highlighter-rouge">Sketchpad</code> –&gt; <code class="language-plaintext highlighter-rouge">iHDR</code></p>

# Settings

<img width="1036" height="1026" alt="image" src="https://github.com/user-attachments/assets/93b9d94f-77d2-44d1-b30a-023aecb0f99c" />

<p>Opening the script reveals the above GUI. Below is a basic explanation of what each setting does:</p>

<ul>
  <li>
    <p><strong>Target View</strong> is the image you want to stretch. The default value is automatically set to the image that was most recently interacted with.</p>
  </li>
  <li>
    <p><strong>Preset</strong> determines the pre-programmed settings you want to use. The options are Low HDR, Medium HDR, and High HDR. As the names suggest, Low HDR will protect the bright areas of the image the least, with the inverse being true for High HDR. Medium HDR will work well for almost all scenarios.</p>
  </li>
  <li>
    <p><strong>Repetitions</strong> is the amount of times the script will run through its entirety on the image. Values above 1 for this option are only relevant for targets with extremely high dynamic range, such as galaxies with very faint halos.</p>
  </li>
  <li>
    <p><strong>Stretch Iterations</strong> determines the amount of times the script will generate a new mask and use it to stretch the image. Higher values will stretch the image more and reduce the strength of the brightness compression, while also increasing the runtime of the script.</p>
  </li>
  <li>
    <p><strong>Stretch Intensity</strong> determines the strength of the stretch that is applied to the image with each iteration. Higher values will lead to a brighter image.</p>
  </li>
  <li>
    <p><strong>Mask Strength</strong> determines how much the bright areas of the image will be protected in each stretch. Higher values will lead to greater HDR compression, bringing the brightness of the bright and faint parts of the image closer together. Higher values also naturally reduce overall image contrast, so a compromise must be made between HDR strength and image contrast.</p>
  </li>
  <li>
    <p><strong>Layer Preservation</strong> determines the smallest features in the image that will be protected during stretching. Smaller values will better protect small, bright features, at the cost of overall contrast.</p>
  </li>
</ul>

<p>The default settings were carefully chosen to provide the best results for the greatest number of scenarios. It is highly recommended to try the default settings with the Medium preset before attempting to make any changes.</p>

# Using the script

<p>To use the script, you must first apply a preliminary stretch to the image. This should be a small stretch; the goal is to get the brightest parts of the image to be as bright as you want them at the end of the stretch. Below are two examples of an appropriate preliminary stretch, one for a nebula target and another for a galaxy target.</p>

<p>To use the script, you must first apply a preliminary stretch to the image. This should be a small stretch; the goal is to get the brightest parts of the image to be as bright as you want them at the end of the stretch. Below are two examples of an appropriate preliminary stretch, one for a nebula target and another for a galaxy target.</p>


<img width="1042" height="1387" alt="image" src="https://github.com/user-attachments/assets/1f242e72-dc8b-4e00-b9dd-d722d389e41a" />


<p>After performing an initial stretch, you may execute iHDR on the image after choosing the appropriate settings. After the script finishes running, assess whether the HDR is enough for your needs or if you need to execute the script again.</p>

<p>Below are the same two images after two executions of iHDR at default settings, versus a default STF autostretch:</p>


<img width="938" height="1248" alt="image" src="https://github.com/user-attachments/assets/d323b48b-4ddb-410e-b419-14f6b47e9358" />


<p>As demonstrated above, iHDR was able to protect the bright areas of these targets while revealing the faint surrounding structure at the same time, which is the goal of the program.</p>
