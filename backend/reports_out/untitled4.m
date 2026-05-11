clc;
clear;
close all;

% تحميل البيانات
load fisheriris

% تقسيم البيانات Train/Test
X = meas;
Y = species;

cv = cvpartition(Y,'HoldOut',0.3);

XTrain = X(training(cv),:);
YTrain = Y(training(cv));

XTest = X(test(cv),:);
YTest = Y(test(cv));

% تدريب مودل KNN
model = fitcknn(XTrain,YTrain);

% التوقع
YPred = predict(model,XTest);

% رسم Confusion Matrix
figure;
confusionchart(YTest,YPred);

title('Confusion Matrix');

% حساب Accuracy
accuracy = sum(YPred == YTest) / numel(YTest);

fprintf('Accuracy = %.2f%%\n',accuracy*100);