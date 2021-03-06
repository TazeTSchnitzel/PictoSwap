(function (PictoSwap) {
    'use strict';

    // Calculates a distance
    function calcDistance(x1, y1, x2, y2) {
        return Math.sqrt(((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1)));
    }

    // Makes a request internal to GET/POST
    function makeRequest(options) {
        var onerror = options.onerror || alert;

        var xhr = new XMLHttpRequest();
        xhr.open(options.method, options.url);
        
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                var data = null,
                    jsonError = 'null response';
                try {
                    var data = JSON.parse(xhr.responseText);
                } catch (jsonError) {
                }

                if (!data) {
                    onerror('Internal PictoSwap error when decoding JSON: ' + jsonError);
                } else if (200 <= xhr.status && xhr.status < 300) {
                    if (data.error) { 
                        onerror(data.error);
                    } else {
                        options.onsuccess(data);
                    }
                } else if (data.error) {
                    onerror(data.error);
                } else {
                    onerror("Request returned " + xhr.status + " " + xhr.statusText);
                }
            }
        };

        if (options.hasOwnProperty('postData')) {
            if (options.hasOwnProperty('postType')) {
                xhr.setRequestHeader('Content-Type', options.postType);
            }
            xhr.send(options.postData);
        } else {
            xhr.send();
        }
    }

    function makeGetRequestURL(options) {
        var params = '';
        if (options.hasOwnProperty('SID')) {
            params = options.SID;
        }
        for (var key in options.message) {
            if (options.message.hasOwnProperty(key)) {
                if (params.length) {
                    params += '&';
                }
                params += key + '=' + encodeURIComponent(options.message[key]);
            }
        }

        return '/api.php?' + params;
    }


    function getRequest(options) {
        options.method = 'GET';
        options.url = makeGetRequestURL(options);
            
        makeRequest(options);
    }

    function postRequest(options) {
        options.method = 'POST';
        if (options.hasOwnProperty('SID')) {
            options.url = '/api.php?' + options.SID;
        } else {
            options.url = '/api.php';
        }
        options.postData = JSON.stringify(options.message);
        options.postType = 'application/json';

        makeRequest(options);
    }

    var backgrounds = [
        'green-letter.png',
        'postcard.png',
        'ripped-notepad.png',
        'fruits.png',
        'blackboard.png'
    ];
    function chooseBackground(context, SID) {
        var chooser = $({
            tagName: 'div',
            id: 'background-chooser',
            parentElement: context.bottomScreen,
            children: [
                $({
                    tagName: 'h2',
                    children: [
                        $('Choose a background')
                    ]
                }),
                $({
                    tagName: 'ul',
                    children: backgrounds.map(function (filename) {
                        return $({
                            tagName: 'li',
                            children: [
                                $({
                                    tagName: 'img',
                                    className: 'background-choice',
                                    src: 'backgrounds/' + filename,
                                    alt: filename + ' background',
                                    onclick: function () {
                                        context.bottomScreen.removeChild(chooser);
                                        compose(filename, context, SID);
                                    }
                                })
                            ]
                        });
                    })
                })
            ]
        });
    }

    function compose(pageBackground, context, SID) {
        var inkMeter = new PictoSwap.InkMeter(20000, 20000),
            colourPicker = new PictoSwap.ColourPicker(),
            canvas = new PictoSwap.Canvas(308, 168),
            previewCanvas = new PictoSwap.Canvas(308, 168);

        context.topScreen.innerHTML = context.bottomScreen.innerHTML = '';

        var previewArea, previewNote, previewFrame;
        previewArea = $({
            parentElement: context.topScreen,
            tagName: 'div',
            id: 'preview-area',
            children: [
                previewNote = $({
                    tagName: 'div',
                    className: 'preview-note',
                    children: [
                        $('Press (A) to play, touch and hold to draw')
                    ]
                }),
                $({
                    tagName: 'div',
                    className: 'canvas-box',
                    children: [
                        previewFrame = $({
                            tagName: 'div',
                            className: 'canvas-frame',
                            children: [
                                previewCanvas.element
                            ]
                        })
                    ]
                }),
                $({
                    tagName: 'div',
                    className: 'preview-date',
                    children: [
                        $((new Date()).toDateString())
                    ]
                })
            ]
        });

        var saveButton, colourButton, drawingArea, canvasFrame, pageCounter, eraserButton, downButton, upButton;
        drawingArea = $({
            parentElement: context.bottomScreen,
            tagName: 'div',
            id: 'drawing-area',
            children: [
                $({
                    tagName: 'div',
                    className: 'canvas-box',
                    children: [
                        canvasFrame = $({
                            tagName: 'div',
                            className: 'canvas-frame',
                            children: [
                                canvas.element
                            ]
                        })
                    ]
                }),
                $({
                    tagName: 'div',
                    id: 'tool-bar',
                    children: [
                        saveButton = $({
                            tagName: 'button',
                            id: 'save-button',
                            children: [
                                $('Exit')
                            ]
                        }),
                        $({
                            tagName: 'div',
                            id: 'colour-box',
                            children: [
                                colourButton = $({
                                    tagName: 'button',
                                    id: 'colour-button'
                                })
                            ],
                        }),
                        $({
                            tagName: 'div',
                            id: 'tool-box',
                            children: [
                                $({
                                    tagName: 'button',
                                    id: 'pencil-button'
                                }),
                                inkMeter.element,
                                eraserButton = $({
                                    tagName: 'button',
                                    id: 'eraser-button'
                                })
                            ]
                        }),
                        pageCounter = $({
                            tagName: 'div',
                            id: 'page-count',
                            children: [
                                $('p. 1/4')
                            ]
                        }),
                        upButton = $({
                            tagName: 'button',
                            id: 'up-button'
                        }),
                        downButton = $({
                            tagName: 'button',
                            id: 'down-button'
                        })
                    ]
                }),
                colourPicker.element
            ]
        });

        var pages = [[], [], [], []], pageInkUsage = [0, 0, 0, 0],
            page = 0, pageCount = 4, inkUsage = 0, empty = true;
        var drawing = false, drawColour = 'black', lastX = 0, lastY = 0;

        previewFrame.style.backgroundImage = 'url(backgrounds/' + pageBackground + ')';
        canvasFrame.style.backgroundImage = 'url(backgrounds/' + pageBackground + ')';

        canvas.element.onmousedown = function (e) {
            // Only allow drawing if we have enough ink
            if (!inkMeter.subtractInk(1)) {
                return;
            }

            // Amount of ink this page uses
            inkUsage += 1;

            if (empty) {
                empty = false;
                saveButton.innerHTML = 'Save';
            }

            // Begin a stroke
            drawing = true;
            canvas.beginStroke();
            previewCanvas.beginStroke();

            // Draw dot
            // We cache x and y to avoid bizzare browser bugs
            // Don't ask me why, but the second time you read e.layerX, it becomes zero!
            var x = e.layerX, y = e.layerY;
            canvas.addDot(drawColour, x, y);
            previewCanvas.addDot(drawColour, x, y);

            // Store the position at present so that we know where next
            // segment will start
            lastX = e.layerX;
            lastY = e.layerY;
        };
        var onMove = canvas.element.onmousemove = function (e) {
            // We cache x and y to avoid bizzare browser bugs
            // Don't ask me why, but the second time you read e.layerX, it becomes zero!
            var x = e.layerX, y = e.layerY;
            
            // Prevent mouse moving causing drawing on desktop
            // (Obviously, "mousemove" can't fire when not dragging on 3DS)
            if (drawing && (lastX !== x || lastY !== y)) {
                // The length of this segment will be subtracted from our "ink"
                var inkUsed = calcDistance(lastX, lastY, x, y);

                // Only allow drawing if we have enough ink
                if (!inkMeter.subtractInk(inkUsed)) {
                    return;
                }

                // Amount of ink this page uses
                inkUsage += inkUsed;

                // Draw line
                canvas.addLine(drawColour, lastX, lastY, x, y);
                previewCanvas.addLine(drawColour, lastX, lastY, x, y);
            }

            lastX = x;
            lastY = y;
        };
        canvas.element.onmouseup = function (e) {
            if (drawing) {
                onMove(e);

                // End of stroke
                canvas.endStroke();
                previewCanvas.endStroke();
                
                drawing = false;
            }
        };

        function serialiseLetter() {
            return {
                background: pageBackground,
                pages: pages,
                pageInkUsage: pageInkUsage
            };
        }

        saveButton.onclick = function () {
            // If pages empty, saveButton is actually exitButton
            if (empty) {
                loadLetters(context, SID);
                return;
            }

            savePage();
            var loadScreen = loading(context.bottomScreen, 'Saving letter...');

            (function request() {
                postRequest({
                    message: {
                        action: 'new_letter',
                        letter: serialiseLetter()
                    },
                    SID: SID,
                    onsuccess: function () {
                        loadLetters(context, SID);
                    },
                    onerror: function (error) {
                        if (confirm("Error! " + error + "\n\nRetry?")) {
                            request();
                        } else {
                            context.bottomScreen.removeChild(loadScreen);
                        }
                    }
                });
            }());
        };

        colourButton.onclick = function () {
            colourPicker.open(function (colour) {
                colourButton.style.backgroundColor = colour;
                drawColour = colour;
            });
        };

        eraserButton.onclick = function () {
            if (confirm("Clear this page?")) {
                canvas.clearStrokes();
                previewCanvas.clearStrokes();

                // Reset ink usage for this page
                inkMeter.addInk(inkUsage);
                inkUsage = 0;

                // Check total ink usage now
                var notEmpty = false;
                console.dir(pageInkUsage);
                pageInkUsage.forEach(function (pageInk, i) {
                    if (pageInk && i !== page) {
                        notEmpty = true;
                    }
                });

                empty = !notEmpty;
                if (empty) {
                    saveButton.innerHTML = 'Exit';
                }
            }
        };

        function savePage() {
            pages[page] = canvas.exportStrokes();
            pageInkUsage[page] = inkUsage;
        }

        function loadPage() {
            canvas.importStrokes(pages[page], true);
            inkUsage = pageInkUsage[page];
            previewCanvas.importStrokes(pages[page], true);
        }

        function updatePageCounter() {
            pageCounter.innerHTML = '';
            pageCounter.appendChild($('p. ' + (page + 1) + '/' + pageCount));
        }

        downButton.onclick = function () {
            // Limit no. of pages
            if (page + 1 < pageCount) {
                savePage();
                page++;
                updatePageCounter()
                loadPage();
            }   
        };

        upButton.onclick = function () {
            if (page - 1 >= 0) {
                savePage();
                page--;
                updatePageCounter()
                loadPage();
            }   
        };

        var cancelFunction = null;
        lib3DS.handleButtons(function (key) {
            if (key === 'A') {
                if (cancelFunction) {
                    cancelFunction();
                    cancelFunction = null;
                    previewNote.innerHTML = '';
                    previewNote.appendChild($('Press (A) to play, touch and hold to draw'));

                    // Replay again (but instantly) so that preview is visible
                    previewCanvas.replay(true);
                } else {
                    cancelFunction = previewCanvas.replay(false, function () {
                        previewNote.innerHTML = '';
                        previewNote.appendChild($('Press (A) to play, touch and hold to draw'));
                        cancelFunction = null;
                    });
                    previewNote.innerHTML = '';
                    previewNote.appendChild($('Press (A) to stop, touch and hold to draw'));
                }
            }
        });
    }

    // Displays loading screen
    function loading(parentElement, text) {
        return $({
            parentElement: parentElement,
            tagName: 'div',
            className: 'loading-background',
            children: [
                $({
                    tagName: 'div',
                    className: 'loading',
                    children: [
                        $({
                            tagName: 'div',
                            className: 'loading-text',
                            children: [
                                $(text)
                            ]
                        }),
                        $({
                            tagName: 'img',
                            src: 'res/spinner.gif'
                        })
                    ]
                })
            ]
        });
    }

    // Views letter
    function viewLetter(context, letter) {
        var content = letter.content;

        var pageCount = 0;
        content.pages.forEach(function (page) {
            if (page.length) {
                pageCount++;
            }
        });

        var previewCanvas = new PictoSwap.Canvas(308, 168);
        var previewArea, previewNote, previewFrame;
        context.topScreen.innerHTML = '';
        previewArea = $({
            parentElement: context.topScreen,
            tagName: 'div',
            id: 'preview-area',
            children: [
                previewNote = $({
                    tagName: 'div',
                    className: 'preview-note',
                    children: [
                        $('Page 1/' + pageCount)
                    ]
                }),
                $({
                    tagName: 'div',
                    className: 'canvas-box',
                    children: [
                        previewFrame = $({
                            tagName: 'div',
                            className: 'canvas-frame',
                            style: {
                                backgroundImage: 'url(backgrounds/' + content.background + ')'
                            },
                            children: [
                                previewCanvas.element
                            ]
                        })
                    ]
                }),
                $({
                    tagName: 'div',
                    className: 'preview-date',
                    children: [
                        $(letter.timestamp)
                    ]
                })
            ]
        });

        (function playPage(pageNo) {
            if (pageNo >= pageCount) {
                return;
            }
            previewNote.innerHTML = 'Page ' + (pageNo + 1) + '/' + pageCount;
            previewCanvas.importStrokes(content.pages[pageNo]);
            previewCanvas.replay(false, function () {
                setTimeout(function () {
                    playPage(pageNo + 1);
                }, 1000);
            });
        }(0));
    }

    // Loads letter for letter view screen
    function loadLetter(context, letterID, SID) {
        getRequest({
            message: {
                action: 'letter',
                id: letterID
            },
            SID: SID,
            onsuccess: function (data) {
                viewLetter(context, data.letter);
            }
        });

        loading(context.topScreen, 'Loading letter...');
    }

    // Makes friend requests popup
    function makeFriendRequests(SID) {
        var friendRequests, logoutButton, newPassword, confirmNewPassword, changePasswordButton, friendRequestList, addFriendBox, addFriendButton, friendList;
        friendRequests = $({
            tagName: 'div',
            id: 'friend-requests',
            className: 'hidden',
            children: [
                logoutButton = $({
                    tagName: 'button',
                    id: 'logout-button',
                    children: [
                        $('Logout')
                    ]
                }),
                $({
                    tagName: 'h2',
                    children: [
                        $('Change password')
                    ]
                }),
                newPassword = $({
                    tagName: 'input',
                    id: 'new-password',
                    type: 'password',
                    placeholder: 'new password'
                }),
                confirmNewPassword = $({
                    tagName: 'input',
                    id: 'confirm-new-password',
                    type: 'password',
                    placeholder: 'confirm new password'
                }),
                changePasswordButton = $({
                    tagName: 'button',
                    id: 'change-password-button',
                    children: [
                        $('Change')
                    ]
                }),
                $({
                    tagName: 'h2',
                    children: [
                        $('Friend requests')
                    ]
                }),
                friendRequestList = $({
                    tagName: 'ul',
                    id: 'friend-request-list',
                    children: [
                        $({
                            tagName: 'img',
                            src: 'res/spinner.gif'
                        })
                    ]
                }),
                addFriendBox = $({
                    tagName: 'input',
                    type: 'text',
                    id: 'add-friend-box',
                    placeholder: 'username'
                }),
                addFriendButton = $({
                    tagName: 'button',
                    id: 'add-friend-button',
                    children: [
                        $({
                            tagName: 'img',
                            src: 'res/friend-add.png'
                        })
                    ]
                }),
                $({
                    tagName: 'h2',
                    children: [
                        $('Friends')
                    ]
                }),
                friendList = $({
                    tagName: 'ul',
                    id: 'friend-list',
                    children: [
                        $({
                            tagName: 'img',
                            src: 'res/spinner.gif'
                        })
                    ]
                })
            ]
        });

        changePasswordButton.onclick = function () {
            if (newPassword.value !== confirmNewPassword.value) {
                alert("Passwords must match!");
                newPassword.value = confirmNewPassword.value = '';
                return;
            }

            postRequest({
                message: {
                    action: 'change_password',
                    new_password: newPassword.value
                },
                SID: SID,
                onsuccess: function () {
                    alert("Password changed.");
                    newPassword.value = confirmNewPassword.value = '';
                }
            });
        };

        logoutButton.onclick = function () {
            postRequest({
                message: {
                    action: 'logout'
                },
                SID: SID,
                onsuccess: function () {
                    window.location.reload();
                }
            });
        };

        function refreshFriendRequests() {
            getRequest({
                message: {
                    action: 'get_friend_requests'
                },
                SID: SID,
                onsuccess: function (data) {
                    if (data.requests.length === 0) {
                        friendRequestList.innerHTML = 'You have no pending requests';
                    } else {
                        friendRequestList.innerHTML = '';
                        data.requests.forEach(function (request) {
                            var friendRequestAccept, friendRequestDeny;
                            $({
                                tagName: 'li',
                                parentElement: friendRequestList,
                                children: [
                                    $(request.username),
                                    friendRequestAccept = $({
                                        tagName: 'button',
                                        className: 'friend-request-accept'
                                    }),
                                    friendRequestDeny = $({
                                        tagName: 'button',
                                        className: 'friend-request-deny'
                                    })
                                ]
                            });
                            friendRequestAccept.onclick = friendRequestDeny.onclick = function () {
                                var mode = (this === friendRequestAccept) ? 'accept' : 'deny';

                                postRequest({
                                    message: {
                                        action: 'friend_request_respond',
                                        friend_user_id: request.user_id,
                                        mode: mode
                                    },
                                    SID: SID,
                                    onsuccess: function () {
                                        alert((mode === 'accept' ? 'Accepted' : 'Denied') + " friend request from '" + request.username + "'.");
                                        refreshFriendRequests();
                                        refreshFriends();
                                    }
                                });
                            };
                        })
                    }
                }
            });
        };
        refreshFriendRequests();

        function refreshFriends() {
            getRequest({
                message: {
                    action: 'get_friends'
                },
                SID: SID,
                onsuccess: function (data) {
                    if (data.friends.length === 0) {
                        friendList.innerHTML = 'You have no friends';
                    } else {
                        friendList.innerHTML = '';
                        data.friends.forEach(function (friend) {
                            var friendRemove;
                            $({
                                tagName: 'li',
                                parentElement: friendList,
                                children: [
                                    $(friend.username),
                                    friendRemove = $({
                                        tagName: 'button',
                                        className: 'friend-remove'
                                    })
                                ]
                            });
                            friendRemove.onclick = function () {
                                if (!confirm("Do you want to remove '" + friend.username + "' from your friends list?")) {
                                    return;
                                }

                                postRequest({
                                    message: {
                                        action: 'friend_remove',
                                        friend_user_id: friend.user_id
                                    },
                                    SID: SID,
                                    onsuccess: function () {
                                        alert("Removed '" + friend.username + "' from your friends list.");
                                        refreshFriends();
                                    }
                                });
                            };
                        })
                    }
                }
            });
        };
        refreshFriends();

        addFriendButton.onclick = function () {
            postRequest({
                message: {
                    action: 'add_friend',
                    username: addFriendBox.value
                },
                SID: SID,
                onsuccess: function () {
                    alert("Sent friend request to '" + addFriendBox.value + "'!");
                    addFriendBox.value = '';
                }
            });
        };
        
        return friendRequests;
    }

    // Displays letter browsing screen
    function browse(context, letters, SID) {
        context.topScreen.innerHTML = context.bottomScreen.innerHTML = '';
        $({
            parentElement: context.topScreen,
            tagName: 'div',
            id: 'preview-area'
        });

        var friendRequests = makeFriendRequests(SID);

        var composeButton, friendsButton, letterCarousel, leftButton, rightButton;
        $({
            parentElement: context.bottomScreen,
            tagName: 'div',
            id: 'browse-area',
            children: [
                letterCarousel = $({
                    tagName: 'div',
                    id: 'letter-carousel'
                }),
                leftButton = $({
                    tagName: 'button',
                    id: 'carousel-left-button'
                }),
                rightButton = $({
                    tagName: 'button',
                    id: 'carousel-right-button'
                }),
                composeButton = $({
                    tagName: 'button',
                    id: 'compose-button',
                    children: [
                        $({
                            tagName: 'img',
                            src: 'res/compose.png'
                        }),
                        $('Write Letter')
                    ]
                }),
                friendsButton = $({
                    tagName: 'button',
                    id: 'friends-button',
                    children: [
                        $({
                            tagName: 'img',
                            src: 'res/friends.png'
                        })
                    ]
                }),
                friendRequests 
            ]
        });

        var LETTER_GAP = 180, letterElements = [], selected = 0, x = 0;
        letters.forEach(function (letter, i) {
            var elem = $({
                tagName: 'img',
                className: 'letter-preview',
                parentElement: letterCarousel,
                style: {
                    left: x + 'px'
                }
            });
            $({
                tagName: 'div',
                className: 'letter-preview-meta',
                parentElement: letterCarousel,
                style: {
                    left: x + 'px',
                },
                children: [
                    letter.own
                    ? $({
                        tagName: 'button',
                        className: 'letter-preview-send',
                        style: {
                            left: x + 'px'
                        },
                        children: [
                            $("Send")
                        ],
                        onclick: function () {
                            sendLetter(letter.letter_id, context, SID);
                        }
                    })
                    : $("from: " + letter.from_username)
                ]
            });
            if (letter.own) {
                elem.className += ' letter-preview-own';
            } else if (!+letter.read) {
                elem.className += ' letter-preview-read';
            }
            elem.onclick = function () {
                updateCarousel(i);
                loadLetter(context, letter.letter_id, SID);
                elem.className = ("" + elem.className).replace(/letter-preview-read/, '');
            };
            letterElements.push(elem);
            x += LETTER_GAP;
        });
        letterCarousel.style.width = x + 'px';
        
        function updateCarousel(newSelected) {
            selected = newSelected;
            letterCarousel.style.marginLeft = selected * -LETTER_GAP + 'px';

            for (
                var i = Math.max(0, selected - 1);
                i <= Math.min(letters.length - 1, selected + 1);
                i++
            ) {
                if (!letters[i].loaded) {
                    letters[i].loaded = true;
                    letterElements[i].src = makeGetRequestURL({
                        message: {
                            action: 'preview_image',
                            letter_id: letters[i].letter_id,
                            page: 0,
                            auth_code: letters[i].auth_code
                        },
                        SID: SID,
                    });
                }
            }
        }

        composeButton.onclick = function () {
            chooseBackground(context, SID);
        };
        
        friendsButton.onclick = function () {
            if (friendRequests.className === 'hidden') {
                friendRequests.className = '';
            } else {
                friendRequests.className = 'hidden';
            }
        };

        var goLeft = leftButton.onclick = function () {
            if (selected - 1 >= 0) {
                updateCarousel(selected - 1);
            }
        }, goRight = rightButton.onclick = function () {
            if (selected + 1 < letters.length) {
                updateCarousel(selected + 1);
            }
        };

        lib3DS.handleButtons(function (key) {
            if (key === 'left') {
                goLeft();
            } else if (key === 'right') {
                goRight();
            } else if (key === 'A') {
                letterElements[selected].onclick();
            }
        });

        updateCarousel(0);
    }

    // Makes request for list of friends then pops up a list to send a letter
    function sendLetter(letterID, context, SID) {
        getRequest({
            message: {
                action: 'get_possible_recipients',
                letter_id: letterID
            },
            SID: SID,
            onsuccess: function (data) {
                context.bottomScreen.removeChild(loadingScreen);

                var friends, friendList, sendButton, cancelButton;
                friends = $({
                    parentElement: context.bottomScreen,
                    tagName: 'div',
                    id: 'friends',
                    children: [
                        $({
                            tagName: 'h2',
                            children: [
                                $('Send letter')
                            ]
                        }),
                        friendList = $({
                            tagName: 'ul',
                            id: 'friend-list'
                        }),
                        sendButton = $({
                            tagName: 'button',
                            id: 'send-button',
                            children: [
                                $("Send")
                            ]
                        }),
                        cancelButton = $({
                            tagName: 'button',
                            id: 'cancel-button',
                            children: [
                                $("Cancel")
                            ]
                        })
                    ]
                });
                if (data.friends.length === 0) {
                    friendList.innerHTML = 'You have no friends that haven\'t yet been sent this letter';
                } else {
                    friendList.innerHTML = '';
                    data.friends.forEach(function (friend) {
                        friend.chosen = false;
                        $({
                            tagName: 'li',
                            parentElement: friendList,
                            children: [
                                $({
                                    tagName: 'input',
                                    type: 'checkbox',
                                    checked: false,
                                    onchange: function () {
                                        friend.chosen = this.checked;
                                    }
                                }),
                                $(friend.username)
                            ]
                        });
                    });
                }
                cancelButton.onclick = function () {
                    context.bottomScreen.removeChild(friends);
                };
                sendButton.onclick = function () {
                    var friendIDs = [];
                    data.friends.forEach(function (friend) {
                        if (friend.chosen) {
                            friendIDs.push(friend.id);
                        }
                    });

                    postRequest({
                        message: {
                            action: 'send_letter',
                            letter_id: letterID,
                            friend_ids: friendIDs
                        },
                        SID: SID,
                        onsuccess: function () {
                            alert("Sent letter!");
                            context.bottomScreen.removeChild(friends);
                        }
                    });
                };
            }
        });

        var loadingScreen = loading(context.bottomScreen, 'Loading friends list...');
    }

    // Makes request for letters then switches to letter browsing screen when done
    function loadLetters(context, SID) {
        getRequest({
            message: {
                action: 'letters'
            },
            SID: SID,
            onsuccess: function (data) {
                browse(context, data.letters, SID);
            }
        });

        loading(context.bottomScreen, 'Loading letters...');
    }

    // Displays login screen
    function login(context) {
        context.topScreen.innerHTML = context.bottomScreen.innerHTML = '';
        $({
            parentElement: context.topScreen,
            tagName: 'div',
            id: 'preview-area',
            children: [
                $({
                    tagName: 'h1',
                    children: [
                        $({
                            tagName: 'img',
                            src: 'res/logo.png',
                            alt: 'PictoSwap'
                        })
                    ]
                }),
                $({
                    tagName: 'p',
                    children: [
                        $('Draw messages on your 3DS and send them to your friends!'),
                    ]
                }),
                $({
                    tagName: 'p',
                    children: [
                        $('Created by Andrea Faulds. '),
                        $({
                            tagName: 'a',
                            href: 'https://github.com/TazeTSchnitzel/PictoSwap',
                            children: [
                                $('Fork me on GitHub')
                            ]
                        }),
                        $('. Follow '),
                        $({
                            tagName: 'a',
                            href: 'https://twitter.com/PictoSwap',
                            children: [
                                $('@PictoSwap')
                            ]
                        }),
                        $(' for updates!')
                    ]
                })
            ]
        });

        var username, password, loginBtn, registerBtn;

        $({
            parentElement: context.bottomScreen,
            tagName: 'div',
            id: 'login-area',
            children: [
                username = $({
                    tagName: 'input',
                    type: 'text',
                    placeholder: 'username',
                    id: 'username-input'
                }),
                password = $({
                    tagName: 'input',
                    type: 'password',
                    placeholder: 'password',
                    id: 'password-input'
                }),
                loginBtn = $({
                    tagName: 'button',
                    id: 'login-button',
                    children: [
                        $('Log in')
                    ]
                }),
                registerBtn = $({
                    tagName: 'button',
                    id: 'register-button',
                    children: [
                        $('Register')
                    ]
                })
            ]
        });

        registerBtn.onclick = function () {
            postRequest({
                message: {
                    action: 'register',
                    username: username.value,
                    password: password.value
                },
                onsuccess: function () {
                    alert("Registration successful. Now try to log in.");
                }
            });
        };

        loginBtn.onclick = function () {
            postRequest({
                message: {
                    action: 'login',
                    username: username.value,
                    password: password.value
                },
                onsuccess: function (data) {
                    loadLetters(context, data.SID);
                }
            });
        };
    }

    window.onerror = alert;
    window.onload = function () {
        var context = lib3DS.initModeDual320();
        var data = PictoSwap.userData;
        if (data.logged_in) {
            loadLetters(context, data.SID);
        } else {
            login(context);
        }
    };
}(window.PictoSwap = window.PictoSwap || {}));
