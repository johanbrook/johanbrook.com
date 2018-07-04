---
title: 'Add delight to web forms (with code sample)'
date: '2011-07-06 09:54'
tags:
    - Ajax
    - city
    - form
    - HTML
    - Javascript
    - jQuery
    - JSON
    - 'postal code'
    - 'User Experience'
category: 'User Experience'
slug: add-delight-to-web-forms-with-code-sample
---

Marking up and styling forms in HTML and CSS is something you either love or hate. Personally I love it, since it's one of these things I can be really nitty-picky with – to iterate and iterate over the appearance and behavior of the form. "Is this simple enough? Is this section necessary? Should we separate this from that?", and so on.  I also love the small details in forms where the regular visitor in me thinks "Huh, that's neat of the form to do that for me", and the web developer in me raises a smile and a quiet chuckle. A great example is the ordering form for [Panic's Transmit](https://www.panic.com/transmit/buy.html).

## Exhibit A: "How many copy may I get you?"
[ ![Panic Transmit](http://johanbrook.com/core/wp-content/uploads/2011/07/Panic-Transmit-1-copy.png) ](http://johanbrook.com/core/wp-content/uploads/2011/07/Panic-Transmit-1-copy.png) Everything looks as it should do. Nothing unusual. [ ![Panic Transmit](http://johanbrook.com/core/wp-content/uploads/2011/07/Panic-Transmit-3-copies.png) ](http://johanbrook.com/core/wp-content/uploads/2011/07/Panic-Transmit-3-copies.png) Try changing the amount of copies, and watch the grammar of the sentence change as well. Also: switch between the "Transmit 4" and "Transmit 4 Upgrade" options and see the sentences change.  That's cool, isn't it? Those small details which really feel logical – _how it should be done everywhere_. It's quite interesting that we're stunned over these kind of details when it should be obvious for a web developer to implement this. This is how we expect forms to work.
## Exhibit B: "Are we there yet?"
In the same form, scroll to the bottom and you'll find the submit button disguised as a progress meter. It'll update live as you complete the form, giving you instant feedback on the eternal question: "Did I get 'em all now?".  [ ![Panic Transmit](http://johanbrook.com/core/wp-content/uploads/2011/07/Panic-Transmit-Process.png) ](http://johanbrook.com/core/wp-content/uploads/2011/07/Panic-Transmit-Process.png) [ ![Panic Transmit](http://johanbrook.com/core/wp-content/uploads/2011/07/Panic-Transmit-Done.png) ](http://johanbrook.com/core/wp-content/uploads/2011/07/Panic-Transmit-Done.png)    I'm sure there are a ton of cases like these all over the websites belonging to hip companies.
## A quick example of nice UX: Automatically fetch the city based on a postal code
How to you add delight to a form, without writing a whole jQuery plugin for it? Let's say you have a sign up form which includes a postal code and city.

    <form method="POST" action="">
    	<label>Postal code 
    		<input type="text" placeholder="810 20" id="postal-code" />
    	</label>
    	
    	<label>City 
    		<input type="text" placeholder="City" id="city" />
    	</label>
    </form>
That code would produce this:  Postal code   City     Nothing weird going on. Now imagine if we could automatically fill the "City" field based on the value from the postal code field. That would be rad, wouldn't it? (Yep, I'm bringing "rad" back).  What's needed? Well, we have to figure out the actual city name. Luckily, there are services for that. You might want to find one for your own country – I found [Postnummersök](http://postnummersok.se/) and [Zip Code API](http://yourmoneyisnowmymoney.com/api/) for Swedish postal codes. I'm pretty confident APIs exist for postal code lookups in your country ( [Google will help you](http://www.google.se/search?sourceid=chrome&ie=UTF-8&q=zip+code+to+city+api)). Go for a simple API, preferably REST and optimally a version which offers JSONP, which means you're able to fetch data right from the Javascript – working around the cross domain restriction.  I ended up with Postnummersok.se, whose API is really simple and straightforward: just send a REST GET request to `http://postnummersok.se/api` with the postal code in the `q` parameter. The response will be returned in JSON (yay!). Even JSONP is possible if you use the `callback` parameter. Follow along below.

    $("#postal-code").blur(function(){ 
    	var url = "http://postnummersok.se/api?callback=?",
    		// remove whitespace in postal code 
    		code = encodeURI(this.value.replace(/s+/g, "")); 
    		
    	$.getJSON(url, {q: code}, function(json){ 
    		if(json === null) return; 
    		
    		$("#city").val(json[0]).select(); 
    	}); 
    });
As you can see I'm using jQuery in this example. A simple `blur` event is binded to the postal code field, and the API URL is defined. Note the `?callback=?` piece, which tells the jQuery XHR to treat the call as JSONP [(read more in the API)](http://api.jquery.com/jQuery.getJSON/#jsonp).  I also removed whitespace in the postal code (some people may write it as "810 20", and others "81020") since I discovered the API didn't like the whitespace formatted version (even though it's URI encoded).  The XHR call is made with `$.getJSON` specifying the postal code as query parameter. A JSON object is returned in the success callback and then I put it in the city field. In this case the JSON consisted of an array – hence the `json[0]` construct – and I want the first (and only) value of that array. Lastly I made sure to select/highlight the input field with `select()` to provide a quick way for the visitor to erase the city name if it's incorrect.  Try it out:  Postal code   City   (As mentioned, it's only taking Swedish postal codes. Try "810 20" and "810 22", as an example).  Neat, isn't it? Thanks to jQuery and the simplicity of the postal code API, we have created this great UX feature just in a couple of lines of code. It's easy for the visitor to get around (just erase the selected city suggestion) and it degrades well (there are no vital features depending on Javascript here).
## Outro
When building forms: put some effort into it, and use your fantasy. "How could I make this super boring form really awesome, easy, and even fun to fill in?". Add delight, but don't get in the visitor's way. Add helpful validation messages, and other help text without bloating the whitespace. Form building is truly a form of art, therefore: iterate, iterate, iterate.
