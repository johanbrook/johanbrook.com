---
title: 'Tags and class names – on building flexible markup'
date: 2013-03-11
keywords:
    - CSS
    - HTML
    - Markup
    - semantic
    - classes
    - 'class names'
category: HTML
slug: tags-and-class-names-on-building-flexible-markup
---

**It is said your markup** should be _clean_ and _semantic_. What does that mean, exactly? As few tags as possible? The correct tags for the job? Few or no ID and class attributes? At least that's been the main formula for a while now. Littering ID and class attributes over your markup has been frowned upon. But what does the alternative mean?
 
 During my years of coding HTML I've done some bad things. Some really bad things, man. I've coded myself into corners, made huge refactors, and so on. One of the main issues I've seen is that the HTML hasn't been **flexible** enough. I've made my markup and styling _too tightly coupled_. Sadly, one of the factors of that has been my urge to do clean and semantic HTML with few attributes on my tags. Changing one thing made me to changes in another place as well. Not DRY.
 
 An example. Here's a box for author information in the bottom of a blog post.

    <footer>
    	<h2>Joe Doe</h2>
    
    	<img src="avatar-joe.jpg" alt="Joe" />
    
    	<p>
    One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections.
    	</p>
    	
    </footer>
Minimal but good example of clean HTML. But a bit naïve. How would you style the image avatar in CSS? Piece of cake (assuming the `footer` element is in an `article` ):

    article footer img {
    	float: left;
    }
Okay. But say you wrap the `img` tag in a `figure` for example? Then your styling perhaps doesn't behave as expected. If you add more images in the box, weird stuff may happen as well.
 
 The author description (in the `p` tag) is interesting too. I've made this example minimal, but now the text is wrapped in a single paragraph tag. But what if you need more paragraphs? Other elements in the description? Then some refactorings has to be made.

    <footer class="post-author">
    	<h2>Joe Doe</h2>
    
    	<figure class="author-avatar">	
    		<img src="avatar-joe.jpg" alt="Joe" />
    	</figure>
    
    	<div class="author-bio">
    		<p>
    			One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections.
    		</p>
    	</div>
    </footer>
Above you see the markup I would write. Notice the additional `class` attributes and the `div` element wrapper.
## But why, oh why?
Because it lets me write **more robust, flexible and portable HTML**. In my CSS, I don't rely on element tags (which may change during time). As long as I don't nest the styling too far, my markup will stay the same if I decide to alter the HTML structure (which as you know always happens). 
 
 In a way, this is what the idea about the roles of HTML and CSS is all about. Remember the markup is for presentation, structure? And CSS is for styling? So why would the presentation and styling be dependent on each other? With `class` hooks, the CSS is able to keep a reference to the elements in the markup in a much more reliable way than only doing element hooks. It's tricky to write super clean HTML for small sites, and close to impossible for larger sites, with content and HTML spitted out from a CMS or whatever. It's your task as a web developer to make your markup and styling go nice together, living in harmony, and using each others' strengths. I usually keep the mantras _modular, re-usable, generalized_ close to mind.
 
 Classes in your markup is fine. Just don't abuse it, keep a sane balance. It's like in sex: if it feels good, it's probably totally okay to do.
