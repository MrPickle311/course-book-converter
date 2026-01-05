package com.bcc.notifications.event

import com.bcc.notifications.NotificationEvent
import com.bcc.notifications.service.NotificationService
import org.slf4j.LoggerFactory
import org.springframework.modulith.events.ApplicationModuleListener
import org.springframework.stereotype.Service

@Service("NotificationsEventHandler")
class EventHandler(
    private val notificationService: NotificationService
){
    private val log = LoggerFactory.getLogger(this::class.java)

    @ApplicationModuleListener
    fun on(event: NotificationEvent) {
        log.info("Received event: $event")
        notificationService.sendNotification(event.message)
    }
}
