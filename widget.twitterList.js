if (!window.om) window.om = {};
var om = window.om;
/*
* Written by Simon Taggart @sitaggart 2012
*/

!function($){
    om.twitterList = {  

        account: '',
        limit: 1,
        showMeta: false,
        showActions: false,
        refreshResults: false,
        queryType: 'user',
        searchTerm: '',

        apiURLs: {
            user: 'https://api.twitter.com/1/statuses/user_timeline.json',
            search: 'https://search.twitter.com/search.json'
        },

        init: function() {
            if(!$('.widget-twitter').length) return;
            this.$tweetWidget = $('.widget-twitter');
            this.$tweetList = this.$tweetWidget.find('#tweet-list');

            //fill defaults
            this.account = (this.$tweetWidget.data('account')) ? this.$tweetWidget.data('account') : this.account;
            this.limit = this.$tweetWidget.data('limit');
            this.showMeta = (this.$tweetWidget.data('meta')) ? this.$tweetWidget.data('meta') : this.showMeta;
            this.showActions = (this.$tweetWidget.data('actions')) ? this.$tweetWidget.data('actions') : this.showActions;
            this.refreshResults = (this.$tweetWidget.data('refresh')) ? this.$tweetWidget.data('refresh') : this.refreshResults;
            this.queryType = (this.$tweetWidget.data('querytype')) ? this.$tweetWidget.data('querytype') : this.queryType;
            this.searchTerm = (this.$tweetWidget.data('search')) ? this.$tweetWidget.data('search') : this.searchTerm;

            this.$tweetWidget.find('.tweet-list-placeholder').html('Talking to the Twitter internets&hellip;');
            this.pullTweets();
        },

        determineURL: function() {
            var baseURL;
            if(this.queryType === 'user') baseURL = this.apiURLs.user;
            else baseURL = this.apiURLs.search;
            return baseURL;
        },

        determineParams: function() {
            var params = {};

            switch(this.queryType){
                case 'user':
                    params = {
                        screen_name: this.account,
                        count: this.limit
                    }
                break;
                case 'search':
                    params = {
                        q: this.searchTerm,
                        rpp: this.limit,
                        result_type: 'recent'
                    }
                break;
                default:                     
            }
            
            if(this.lastTweetId) params.since_id = this.lastTweetId;
            params.include_entities = 'true';
            return params;
        },

        pullTweets: function() {
            var self = this,
                url = this.determineURL(),
                params = this.determineParams();

            $.ajax({
                url: url,
                data: params,
                dataType: 'jsonp',
                type: 'GET',
                success: function(data, textStatus, jqXHR){
                    self.responseData = data;
                },
                error: function(){
                    self.handleResponse('error');
                },
                complete: function(){
                    self.handleResponse('success');
                    if(self.refreshResults) {
                        setTimeout(function(){
                            self.pullTweets();
                        }, 10000);
                    }
                }
            });

        },

        tweetify: function (str) {
            return str.replace(/(https?:\/\/\S+)/gi, '<a href="$1">$1</a>').replace(/(^|\s)@(\w+)/g, '$1<a href="http://twitter.com/$2">@$2</a>').replace(/(^|\s)#(\w+)/g, '$1<a href="http://search.twitter.com/search?q=%23$2">#$2</a>');
        },
        
        handleResponse: function(type) {
            switch(type){
                case 'success':
                    if(!this.lastTweetId) this.$tweetList.append($('<ul/>'));

                    var tweetsData = [],
                        tmplData = {};

                    if(this.queryType === 'user') { 
                        for (var i = this.responseData.length - 1; i >= 0; i--) {
                            tmplData = {
                                text: this.responseData[i].text,
                                user: this.account,
                                id: this.responseData[i].id_str,
                                date: this.responseData[i].created_at,
                                source: this.responseData[i].source
                            };
                            tweetsData.push(tmplData);
                        };
                    }
                    else { 
                        for (var i = this.responseData.results.length - 1; i >= 0; i--) {
                            tmplData = {
                                text: this.responseData.results[i].text,
                                user: this.responseData.results[i].from_user,
                                id: this.responseData.results[i].id_str,
                                date: this.responseData.results[i].created_at,
                                source: this.responseData.results[i].source
                            };
                            tweetsData.push(tmplData);
                        };
                    }
                    this.renderTweets(tweetsData);

                    this.$tweetWidget.find('.tweet-list-placeholder').fadeOut().remove(); 
                break;
                case 'error':
                    this.$tweetList.html('<p>Don&rsquo;t judge us, but something broke.</p>'); 
                break;
                default:                    
            }            
        },

        renderTweets: function(d) {
            var self = this,
                tmp, tweet, meta, action;

            $.each(d, function (i, tweet) {
                tmp = self.tweetify(tweet.text);
                tweetText = getTweetText(tmp);
                meta = getMetaText(tweet);
                action = getActions(tweet);
                self.$tweetList.find('> ul').prepend(
                    '<li>' + tweetText + meta + action +'</li>'
                );
                //set last tweet id
                self.lastTweetId = tweet.id;
            });

            function getTweetText(t){
                return '<p>' + t + '</p>';
            }
            function getMetaText(tweet){
                return (self.showMeta) ? '<span class="tweet-list-time"><a href="https://twitter.com/#!/'+ tweet.user +'/status/'+ tweet.id +'">' + getTime.relative(tweet.date) + '</a> via ' + cleanSource(tweet.source) + '</span>' : '';
            }
            function getActions(tweet){
                return (self.showActions) ? '<ul><li class="tweet-list-action"><a href="https://twitter.com/intent/retweet?tweet_id='+ tweet.id +'">retweet</a></li></ul>' : '';
            }
            function cleanSource(source){
             	return source.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');
            }
        }
    }
    
    //lifted from https://github.com/remy/twitterlib/blob/master/twitterlib.js Thanks Remy
    var getTime=function(){var a=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return{time:function(d){var b=d.getHours(),e=d.getMinutes()+"",c="AM";if(b==0){b=12}else{if(b==12){c="PM"}else{if(b>12){b-=12;c="PM"}}}if(e.length==1){e="0"+e}return b+":"+e+" "+c},date:function(c){var e=a[c.getMonth()],b=c.getDate()+"",h=~~(b),d=c.getFullYear(),g=(new Date()).getFullYear(),f="th";if((h%10)==1&&b.substr(0,1)!="1"){f="st"}else{if((h%10)==2&&b.substr(0,1)!="1"){f="nd"}else{if((h%10)==3&&b.substr(0,1)!="1"){f="rd"}}}if(b.substr(0,1)=="0"){b=b.substr(1)}return e+" "+b+f+(g!=d?", "+d:"")},shortdate:function(h){var d=h.split(" "),b=Date.parse(d[1]+" "+d[2]+", "+d[5]+" "+d[3]),e=new Date(b),g=a[e.getMonth()],c=e.getDate()+"",f=e.getFullYear(),i=(new Date()).getFullYear();if(i===f){return c+" "+g}else{return c+" "+g+(f+"").substr(2,2)}},datetime:function(d){var b=d.split(" "),c=new Date(Date.parse(b[1]+" "+b[2]+", "+b[5]+" "+b[3]));return this.time(c)+" "+this.date(c)},relative:function(e){var c=e.split(" "),b=Date.parse(c[1]+" "+c[2]+", "+c[5]+" "+c[3]),d=new Date(b),g=(arguments.length>1)?arguments[1]:new Date(),h=~~((g.getTime()-b)/1000),f="";h=h+(g.getTimezoneOffset()*60);if(h<=1){f="1 second ago"}else{if(h<60){f=h+" seconds ago"}else{if(h<120){f="1 minute ago"}else{if(h<(45*60)){f=(~~(h/60))+" minutes ago"}else{if(h<(2*90*60)){f="1 hour ago"}else{if(h<(24*60*60)){f=(~~(h/3600))+" hours ago"}else{f=this.shortdate(e)}}}}}}return f}}}();

    om.twitterList.init();

}(window.jQuery);
