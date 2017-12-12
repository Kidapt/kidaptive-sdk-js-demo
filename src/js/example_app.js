/**
 * Created by solomonliu on 1/18/17.
 */

//initialize Foundation
$(document).foundation();

//initialize SDK
var sdkPromise = KidaptiveSdk.init("gPt1fU+pTaNgFv61Qbp3GUiaHsGcu+0h8", {version:"1.0.0", build:"1000"});
sdkPromise.then(function() {
    updateStatus("SDK successfully initialized", "success");
    $("#content").removeClass("invisible");
    updateAppInfo();
}, function(error) {
    updateStatus("Error initializing SDK: " + error.code + " " + error.message, "alert");
});

var updateStatus = function(message, type) {
    $("#status-message").text(message);
    $("#status").removeClass("primary secondary success warning alert")
        .addClass(type)
        .removeClass("invisible");
};

//app info
var updateAppInfo = function() {
    return sdkPromise.then(function(sdk) {
        $("#app-uri").text("App Uri: " + sdk.appInfo.uri);
        $("#app-secret").text("App Secret: " + sdk.appSecret);
        $("#app-version").text("App Version: " + sdk.appInfo.version);
        $("#app-build").text("App Build: " + sdk.appInfo.build);
    });
};

//user management
var updateUserInfo = function() {
    return sdkPromise.then(function(sdk) {
        var login = $("#login");
        var userInfo = $("#user-info");
        if (sdk.getCurrentUser()) {
            login.addClass("hide");
            $("#user-id").text("ID: " + sdk.getCurrentUser().id);
            $("#user-email").text("Email: " + sdk.getCurrentUser().email);
            $("#user-name").val(sdk.getCurrentUser().nickname);
            $("#user-password").val("");
            userInfo.removeClass("hide");
        } else {
            $("input",login).val("");
            $("#user-id").text("");
            $("#user-email").text("");
            $("#user-name").val("");
            $("#user-password").val("");
            userInfo.removeClass("hide");
            login.removeClass("hide");
            userInfo.addClass("hide");
        }
    });
};

var kidaptiveLogin = function() {
    updateStatus("Logging in...", "primary");
    disableButtons(true);
    return sdkPromise.then(function(sdk) {
        return sdk.loginUser($("#username").val(), $("#password").val());
    }).then(function() {
        updateStatus("Successfully logged in", "success");
        return updateUserInfo();
    }, function(error) {
        updateStatus("Error logging in: " + error.toString(), "alert");
    }).then(function() {
        disableButtons(false);
    });
};

var createUser = function() {
    updateStatus("Creating user...", "primary");
    disableButtons(true);
    return sdkPromise.then(function(sdk) {
        return sdk.createUser($("#username").val(), $("#password").val(), $("#name").val());
    }).then(function() {
        updateStatus("User successfully created", "success");
        return updateUserInfo();
    }, function(error) {
        updateStatus("Error creating user: " + error.toString(), "alert");
        $("#login").removeClass("hide");
    }).then(function() {
        disableButtons(false);
    });
};

var oidcLogin = function() {
    updateStatus("Not implemented", "alert");
};

var logout = function() {
    updateStatus("Logging out...", "primary");
    disableButtons(true);
    return sdkPromise.then(function(sdk) {
        sdk.logoutUser();
        updateUserInfo();
        updateLearnerInfo();
        updateModelInfo();
        updateEventInfo();
        updateStatus("Logged out", "success");
        disableButtons(false);
    })
};

var modifyUser = function() {
    updateStatus("Updating user...", "primary");
    disableButtons(true);
    return sdkPromise.then(function(sdk) {
        return sdk.updateUser({nickname:$("#user-name").val(), password:$("#user-password").val()});
    }).then(function() {
        updateStatus("User successfully updated", "success");
        return updateUserInfo();
    }, function(error) {
        updateStatus("Error updating user: " + error.toString(), "alert");
    }).then(function() {
        disableButtons(false);
    });
};

var deleteUser = function() {
    updateStatus("Deleting user...", "primary");
    disableButtons(true);
    return sdkPromise.then(function(sdk) {
        return sdk.deleteUser();
    }).then(function() {
        updateStatus("User successfully deleted", "success");
        return updateUserInfo();
    }, function(error) {
        updateStatus("Error deleting user: " + error.toString(), "alert");
    }).then(function() {
        disableButtons(false);
    });
};

//learner management
var updateLearnerInfo = function() {
    return sdkPromise.then(function(sdk) {
        var learnerInfoDiv = $("#learner-info");
        var createLearner = $("#create-learner");
        var noUser = $("#learner-no-user");
        if (sdk.getCurrentUser()) {
            createLearner.removeClass("hide");
            noUser.addClass("hide");
            var learnerList = sdk.getLearnerList();
            var learnerInfo = d3.select("#learner-info-accordion").selectAll("li").data(learnerList);
            learnerInfo.exit().remove();
            learnerInfo.enter().append("li").attr("class", "learner-info accordion-item").attr("data-accordion-item", "").each(function() {
                d3.select(this).append("a")
                    .attr("href", "#")
                    .attr("class", "learner-id accordion-title");
                var content = d3.select(this).append("div")
                    .attr("class", "accordion-content")
                    .attr("data-tab-content", "");
                var row = content.append("div").attr("class", "row unstack");
                row.append("label").attr("class", "column medium-5").text("Name")
                    .append("input").attr("class", "learner-name").attr("type", "text");
                row.append("label").attr("class", "column medium-5").text("Birthday")
                    .append("input").attr("class", "learner-birthday").attr("type", "date");
                var select = row.append("label").attr("class", "column medium-2").text("Gender")
                    .append("select").attr("class", "learner-gender");
                select.append("option");
                select.append("option").text("female");
                select.append("option").text("male");
                content.append("button").attr("class", "button action").text("Update Learner Info").on("click", modifyLearner);
                content.append("button").attr("class", "button action alert").text("Delete Learner").on("click", deleteLearner)
                    .node().insertAdjacentHTML("beforebegin", " ");
            }).merge(learnerInfo).each(function(d) {
                d3.select(this).select(".learner-id").text(d.id);
                d3.select(this).select(".learner-name").property("value", d.name);
                var birthday = d.birthday ? new Date(d.birthday).toISOString() : "";
                d3.select(this).select(".learner-birthday").property("value", birthday.substring(0, birthday.indexOf("T")));
                d3.select(this).select(".learner-gender").property("value", d.gender == 'decline' ? "" : d.gender);
            });

            Foundation.reInit("accordion");

            if (learnerList.length > 0) {
                learnerInfoDiv.removeClass("hide")
            } else {
                learnerInfoDiv.addClass("hide");
            }
        } else {
            $("#learner-info-accordion").html("");
            createLearner.addClass("hide");
            learnerInfoDiv.addClass("hide");
            noUser.removeClass("hide");
        }
    })
};

var modifyLearner = function() {
    updateStatus("Updating Learner...", "primary");
    disableButtons(true);
    return sdkPromise.then(function(sdk) {
        var info = $(".learner-info.is-active");
        return sdk.updateLearner(d3.select(info[0]).data()[0].id,{name: $(".learner-name",info).val(), birthday: new Date($(".learner-birthday",info).val()),gender: $(".learner-gender",info).val() || "decline"});
    }).then(function() {
        updateStatus("Learner successfully updated", "success");
        return updateLearnerInfo();
    }, function(error) {
        updateStatus("Error updating learner: " + error.toString(), "alert");
    }).then(function() {
        disableButtons(false);
    });
};

var deleteLearner = function() {
    updateStatus("Creating Learner...", "primary");
    disableButtons(true);
    return sdkPromise.then(function(sdk) {
        return sdk.deleteLearner(d3.select(".learner-info.is-active").data()[0].id);
    }).then(function() {
        updateStatus("Learner successfully deleted", "success");
        //close all accordion content
        var acc = $("#learner-info-accordion");
        acc.foundation("up", $(".accordion-content", acc));
        return updateLearnerInfo();
    }, function(error) {
        updateStatus("Error deleting learner: " + error.toString(), "alert");
    }).then(function() {
        disableButtons(false);
    });
};

var createLearner = function() {
    updateStatus("Creating Learner...", "primary");
    disableButtons(true);
    return sdkPromise.then(function(sdk) {
        return sdk.createLearner($("#create-learner-name").val(),new Date($("#create-learner-birthday").val()),$("#create-learner-gender").val() || "decline");
    }).then(function() {
        updateStatus("Learner successfully created", "success");
        var createDiv = $("#create-learner");
        $("input", createDiv).val("");
        $("select", createDiv).val("");
        return updateLearnerInfo();
    }, function(error) {
        updateStatus("Error creating learner: " + error.toString(), "alert");
    }).then(function() {
        disableButtons(false);
    });
};

//Event Management
var updateEventInfo = function() {
    return sdkPromise.then(function(sdk) {
        var noUser = $("#event-no-user");
        var eventDiv = $("#event");
        var eventTrial = $("#event-trial");
        eventTrial.val("");
        if (sdk.getCurrentUser()) {
            noUser.addClass("hide");
            eventDiv.removeClass("hide");
            var t = sdk.getCurrentTrial($("#event-learner").val());
            if (t) {
                eventTrial.val(t.trialTime);
            }
        } else {
            $("input[type!='button']", eventDiv).val("");
            $(".row", ".key-value").remove();
            noUser.removeClass("hide");
            eventDiv.addClass("hide");
        }
    });
};

var reportEvent = function() {
    updateStatus("Reporting Event...", "primary");
    disableButtons(true);
    return sdkPromise.then(function(sdk) {
        var args = {additionalFields: {}, tags: {}};

        $(".row", $(".row", "#event-fields")).each(function() {
            var inputs = $("input",$(this));
            if (inputs[0].value) {
                args.additionalFields[inputs[0].value] = inputs[1].value;
            }
        });

        $(".row", $(".row", "#event-tags")).each(function() {
            var inputs = $("input",$(this));
            if (inputs[0].value) {
                args.tags[inputs[0].value] = inputs[1].value;
            }
        });

        var v;
        if (v = $("#event-duration").val()) {
            args.duration = v;
        }

        if ($("#event-type")[0].checked) {
            var attempts = [];
            $(".row", $(".row", "#event-attempts")).each(function() {
                var inputs = $("input",$(this));
                if (inputs[0].value) {
                    attempts.push({itemURI: inputs[0].value, outcome: inputs[1].value});
                }
            });

            args.promptAnswers = {};
            $(".row", $(".row", "#event-answers")).each(function() {
                var inputs = $("input",$(this));
                if (inputs[0].value) {
                    args.promptAnswers[inputs[0].value] = inputs[1].value;
                }
            });

            return sdk.reportEvidence(
                $("#event-name").val(),
                $("#event-learner").val(),
                $("#event-prompt").val(),
                attempts,
                args);
        } else {
            if (v = $("#event-learner").val()) {
                args.learnerId = v;
            }
            if (v = $("#event-prompt").val()) {
                args.promptUri = v;
            }
            if (v = $("#event-game").val()) {
                args.gameUri = v;
            }

            return sdk.reportBehavior(
                $("#event-name").val(),
                args
            );
        }
    }).then(function() {
        updateStatus("Event successfully reported", "success");
        var eventDiv = $("#event");
        $("input[type!='button']", eventDiv).val("");
        $(".row", ".key-value").remove();
        return updateEventInfo();
    }, function(error) {
        updateStatus("Error reporting event: " + error.toString(), "alert");
    }).then(function() {
        disableButtons(false);
    });
};

//Model Management
var updateModelInfo = function() {
    return sdkPromise.then(function(sdk) {
        var noUser = $("#model-no-user");
        var noLearner = $("#model-no-learner");
        var learnerModels = $("#model-learner");
        if (sdk.getCurrentUser()) {
            noUser.addClass("hide");
            var learners = sdk.getLearnerList();
            if (learners.length > 0) {
                learnerModels.removeClass("hide");
                noLearner.addClass("hide");

                var localAbils = d3.select("#local-abil-accordion").selectAll("li").data(learners);
                localAbils.exit().remove();
                localAbils.enter().append("li").attr("class", "learner-info accordion-item").attr("data-accordion-item", "").each(function() {
                    d3.select(this).append("a")
                        .attr("href", "#")
                        .attr("class", "learner-id accordion-title");
                    d3.select(this).append("div")
                        .attr("class", "accordion-content")
                        .attr("data-tab-content", "");
                }).merge(localAbils).each(function(d) {
                    d3.select(this).select(".learner-id").text(d.id);
                    text = sdk.getLocalDimensions().sort().map(function(ld) {
                        return ld.uri + ": " + sdk.getLocalAbility(d.id, ld.uri).mean.toFixed(3);
                    }).join("<br>");
                    d3.select(this).select(".accordion-content").html(text);
                });

                var latentAbils = d3.select("#latent-abil-accordion").selectAll("li").data(learners);
                latentAbils.exit().remove();
                latentAbils.enter().append("li").attr("class", "learner-info accordion-item").attr("data-accordion-item", "").each(function() {
                    d3.select(this).append("a")
                        .attr("href", "#")
                        .attr("class", "learner-id accordion-title");
                    d3.select(this).append("div")
                        .attr("class", "accordion-content")
                        .attr("data-tab-content", "");
                }).merge(latentAbils).each(function(d) {
                    d3.select(this).select(".learner-id").text(d.id);
                    text = sdk.getDimensions().sort().map(function(ld) {
                        return ld.uri + ": " + sdk.getLatentAbility(d.id, ld.uri).mean.toFixed(3);
                    }).join("<br>");
                    d3.select(this).select(".accordion-content").html(text);
                });

                Foundation.reInit("accordion");
            } else {
                learnerModels.addClass("hide");
                noLearner.removeClass("hide");
            }
        } else {
            $("#local-abil-accordion").html("");
            $("#latent-abil-accordion").html("");
            noUser.removeClass("hide");
            noLearner.addClass("hide");
            learnerModels.addClass("hide");
        }

        [['game', sdk.getGames.bind(sdk)], ['prompt', sdk.getPrompts.bind(sdk)], ['dimension', sdk.getDimensions.bind(sdk)], ['localDimension', sdk.getLocalDimensions.bind(sdk)], ['category', sdk.getCategories.bind(sdk)]]
            .forEach(function(type) {
                var selection = d3.select("#model-filter-" + type[0]).selectAll("option")
                    .data([""].concat(type[1]().map(function(x){return x.uri;}).sort()));
                selection.exit().remove();
                selection.enter().append("option")
                    .merge(selection)
                    .attr("value", function(d) {return d;})
                    .text(function(d) {return d;});
            });
    });
};

var changeModelType = function() {
    $(".model-filter").addClass("hide");
    var type = $("#model-type").val();
    if (type) {
        $(".model-info").removeClass("hide");
        $(".filter-" + type).removeClass("hide");
        filterModels();
    } else {
        $(".model-info").addClass("hide")
    }
    $(".model-select").val("");
    selectModelById();
};

var filterModels = function() {
    return sdkPromise.then(function(sdk) {
        var modelUri = $("#model-uri");
        var modelId = $("#model-id");

        var uri = modelUri.val();
        var id = modelId.val();

        var models;
        var gameFilter = $("#model-filter-game").val();
        var promptFilter = $("#model-filter-prompt").val();
        var dimensionFilter = $("#model-filter-dimension").val();
        var localDimensionFilter = $("#model-filter-localDimension").val();
        var categoryFilter = $("#model-filter-category").val();
        switch ($("#model-type").val()) {
            case "game":
                models = sdk.getGames();
                break;
            case "prompt":
                models = sdk.getPrompts(gameFilter);
                break;
            case "item":
                models = sdk.getItems(gameFilter,promptFilter,dimensionFilter,localDimensionFilter);
                break;
            case "dimension":
                models = sdk.getDimensions();
                break;
            case "localDimension":
                models = sdk.getLocalDimensions(dimensionFilter,gameFilter);
                break;
            case "category":
                models = sdk.getCategories(promptFilter, gameFilter);
                break;
            case "instance":
                models = sdk.getInstances(categoryFilter);
                break;
        }
        var selection = d3.select("#model-uri").selectAll("option").data([""].concat(models.map(function(x){return x.uri;}).sort()));
        selection.exit().remove();
        selection.enter().append("option").merge(selection)
            .attr("value", function(d) {return d;})
            .text(function(d) {return d;});

        selection = d3.select("#model-id").selectAll("option").data([""].concat(models.map(function(x){return x.id;}).sort(function(x,y){return x-y;})));
        selection.exit().remove();
        selection.enter().append("option").merge(selection)
            .attr("value", function(d) {return d;})
            .text(function(d) {return d;});

        modelUri.val(uri);
        modelId.val(id);
        selectModelById();
    });
};

var selectModelByUri = function() {
    return sdkPromise.then(function (sdk) {
        var model = sdk.getEntityByUri($("#model-type").val(), $("#model-uri").val());
        showModelInfo(model);
    });
};

var selectModelById = function() {
    return sdkPromise.then(function (sdk) {
        var model = sdk.getEntityById($("#model-type").val(), $("#model-id").val());
        showModelInfo(model);
    });
};

var showModelInfo = function (model) {
    if (model) {
        $("#model-id").val(model.id);
        $("#model-uri").val(model.uri);
        text = ['id', 'uri', 'name', 'key', 'value', 'gameId', 'promptId', 'dimensionId', 'localDimensionId', 'mean']
            .filter(function(key) {
                return !!model[key];
            }).map(function(key) {
                return key + ": " + model[key];
            }).join("<br>");
        $("#model-info").html(text);
    } else {
        $("#model-id").val("");
        $("#model-uri").val("");
        $("#model-info").text("Select a URI or ID to view model details")
    }
};

$("#tab-app-label").on("click", updateAppInfo);
$("#tab-user-label").on("click", updateUserInfo);
$("#tab-learner-label").on("click", updateLearnerInfo);
$("#tab-event-label").on("click", updateEventInfo);
$("#tab-model-label").on("click", updateModelInfo);
$(".key-value").on("click", function(e) {
    if ($(e.target).hasClass("add-row")) {
        var keyName = "";
        var valueName = "Value";
        var valueType = "text";
        switch (this.id) {
            case "event-attempts":
                keyName = "Item URI";
                valueName = "Outcome";
                valueType = "number";
                break;
            case "event-answers":
                keyName = "Category URI";
                break;
            case "event-fields":
                keyName = "Field Name";
                break;
            case "event-tags":
                keyName = "Tag Name";
                break;
        }
        var row = d3.select(this).insert("div", ".add-row")
            .attr("class", "row").on("click", function() {
                if ($(d3.event.target).hasClass("close-button")) {
                    $(this).remove();
                }
            });
        var inputs = row.append("div").attr("class", "column small-11")
            .append("div").attr("class", "row");
        inputs.append("div").attr("class", "column small-6")
            .append("input")
            .attr("type", "text")
            .attr("placeholder", keyName);
        inputs.append("div").attr("class", "column small-6")
            .append("input")
            .attr("type", valueType)
            .attr("placeholder", valueName);
        row.append("div").attr("class", "column small-1")
            .append("button").attr("class", "close-button").html("&times;").style("position", "inherit");
    }
});
$(".model-filter").on("change", filterModels);

var disableButtons = function(disable) {
    $("button.action").prop("disabled", disable);
};

var setEventType = function() {
    var checked = $("#event-type")[0].checked;
    d3.select("#event-type-group").selectAll("label").classed("secondary", function(d, i) {
        return !checked != !i;
    }).style("color", function(d, i) {
        return !checked != !i ? "rgba(255,255,255,.5)" : null;
    });

    d3.selectAll(".evidence").classed("hide", !checked);
    d3.selectAll(".behavior").classed("hide", checked);
};

var startTrial = function() {
    disableButtons("true");
    return sdkPromise.then(function(sdk) {
        sdk.startTrial($("#event-learner").val());
        return updateEventInfo();
    }).catch(function(error) {
        updateStatus("Error starting trial: " + error.toString(), "alert");
    }).then(function() {
        disableButtons(false);

    });
};

var endTrial = function() {
    disableButtons("true");
    return sdkPromise.then(function(sdk) {
        sdk.closeTrial($("#event-learner").val());
        disableButtons(false);
        return updateEventInfo();
    });
};