#include <ros/ros.h>
#include <std_msgs/String.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main(int argc, char** argv){
	time_t now = time(NULL);
	struct tm *pnow = localtime(&now);
	char test[100] = {0};
	
	ros::init(argc, argv, "basic_simple_talker");
	ros::NodeHandle nh;
	ros::Publisher chatter_pub = nh.advertise<std_msgs::String>("chatter", 10);
	ros::Rate loop_rate(10);
	
	int count = 0;
	while (ros::ok()){
		std_msgs::String msg;
		
		now = time(NULL);
		pnow = localtime(&now);
		sprintf(test, "hello world! %d.%02d.%02d %02d:%02d:%02d  %d", pnow->tm_year+1900, pnow->tm_mon + 1, pnow->tm_mday, pnow->tm_hour, pnow->tm_min, pnow->tm_sec, count);
		msg.data = test;
		
		ROS_INFO("publish: %s", msg.data.c_str());
		chatter_pub.publish(msg);
	
		ros::spinOnce();
		loop_rate.sleep();
		++count;
	}
	
	return 0;
}