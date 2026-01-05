package com.bcc.notifications.controller

import com.bcc.book.service.BookService
import com.bcc.notifications.service.NotificationService
import org.slf4j.LoggerFactory
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.util.concurrent.CopyOnWriteArrayList

@RestController
class NotificationController(
    private val notificationService: NotificationService
) {

    @GetMapping(value = ["/subscribe"], produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun subscribe(): SseEmitter {
        val emitter = SseEmitter(Long.MAX_VALUE)
        notificationService.addEmitter(emitter)

        notificationService.cleanupOnDisconnectionOrTimeout(emitter)

        return emitter
    }

}